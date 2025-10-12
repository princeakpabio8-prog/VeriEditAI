import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { FollowButton } from '@/components/profile/FollowButton';
import { Search, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface User {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  followers_count?: number;
}

const FindUsers = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestedUsers = async () => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url, followers_count')
        .not('user_id', 'eq', user?.id || '')
        .not('username', 'is', null)
        .order('followers_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestedUsers(data || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query,
        limit_count: 20
      });

      if (error) throw error;
      
      // Filter out current user
      const filtered = (data || []).filter((u: User) => u.user_id !== user?.id);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const UserCard = ({ user: profileUser }: { user: User }) => (
    <div className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <Link to={`/user/${profileUser.user_id}`}>
        <UserAvatar
          avatarUrl={profileUser.avatar_url}
          fullName={profileUser.full_name}
          size="lg"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/user/${profileUser.user_id}`} className="hover:underline">
          <div className="font-medium truncate">
            {profileUser.full_name || 'Anonymous User'}
          </div>
        </Link>
        <div className="text-sm text-muted-foreground">
          @{profileUser.username}
        </div>
        {profileUser.followers_count !== undefined && profileUser.followers_count > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {profileUser.followers_count} followers
          </div>
        )}
      </div>
      <FollowButton targetUserId={profileUser.user_id} />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Users</h1>
          <p className="text-muted-foreground">
            Connect with other members of the community
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Users
            </CardTitle>
            <CardDescription>
              Search by username or name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((user) => (
                  <UserCard key={user.user_id} user={user} />
                ))}
              </div>
            )}

            {!loading && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggested Users */}
        {!searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Suggested Users
              </CardTitle>
              <CardDescription>
                Popular users you might want to follow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : suggestedUsers.length > 0 ? (
                <div className="space-y-3">
                  {suggestedUsers.map((suggestedUser) => (
                    <UserCard key={suggestedUser.user_id} user={suggestedUser} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No suggested users at the moment
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FindUsers;
