import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/ui/navigation';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Settings, CreditCard, BarChart3, Puzzle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MobileOptimizedUI } from '@/components/mobile-optimized-ui';
import { useIsMobile } from '@/hooks/use-mobile';
import { ApiKeyManager } from '@/components/api-key-manager';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { FollowersList } from '@/components/profile/FollowersList';
import { ProfileAchievements } from '@/components/ProfileAchievements';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { lower } from '@/lib/string';

interface Profile {
  full_name: string;
  company: string;
  avatar_url?: string | null;
  username?: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ full_name: '', company: '', avatar_url: null, username: null });
  const [loading, setLoading] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUsageStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          company: data.company || '',
          avatar_url: data.avatar_url || null,
          username: data.username || null,
        });
        setFollowersCount(data.followers_count || 0);
        setFollowingCount(data.following_count || 0);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const fetchUsageStats = async () => {
    try {
      // Get total verifications
      const { count: totalCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get this month's verifications
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      setVerificationCount(totalCount || 0);
      setMonthlyUsage(monthlyCount || 0);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase.rpc('is_username_available', {
        username_to_check: username
      });

      if (error) throw error;
      setUsernameAvailable(data);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (newUsername: string) => {
    const lowercase = lower(newUsername);
    setProfile({ ...profile, username: lowercase });
    
    setTimeout(() => {
      if (lowercase && lowercase !== profile.username) {
        checkUsernameAvailability(lowercase);
      }
    }, 500);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (profile.username && usernameAvailable === false) {
      toast({
        title: "Invalid username",
        description: "This username is already taken or invalid.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          full_name: profile.full_name,
          company: profile.company,
          username: profile.username || null,
          avatar_url: profile.avatar_url || null,
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const content = (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and view usage statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 pb-6 border-b border-border">
                  <AvatarUploader
                    userId={user?.id || ''}
                    currentAvatarUrl={profile.avatar_url}
                    fullName={profile.full_name}
                    onUploadComplete={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
                    onDelete={() => setProfile(prev => ({ ...prev, avatar_url: null }))}
                  />
                </div>
                
                <form onSubmit={updateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed from this page
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={profile.username || ''}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={
                        profile.username
                          ? usernameAvailable === true
                            ? 'border-green-500'
                            : usernameAvailable === false
                            ? 'border-red-500'
                            : ''
                          : ''
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      3-20 characters, lowercase letters, numbers, and underscores only
                    </p>
                    {checkingUsername && (
                      <p className="text-xs text-muted-foreground">Checking availability...</p>
                    )}
                    {usernameAvailable === true && profile.username && (
                      <p className="text-xs text-green-600">✓ Username available</p>
                    )}
                    {usernameAvailable === false && profile.username && (
                      <p className="text-xs text-red-600">✗ Username not available</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Enter your company name"
                      value={profile.company}
                      onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Browser Extension Info */}
            <Alert className="bg-gradient-card border-primary/20">
              <Puzzle className="h-4 w-4 text-primary" />
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground mb-1">Browser Extension Available</p>
                  <p className="text-sm text-muted-foreground">
                    Verify content on social media platforms. Generate an API key below to get started.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
                  <Link to="/extensions">
                    Learn More
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>

            {/* API Keys */}
            <ApiKeyManager />

            {/* Account Settings */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <CardTitle>Account Settings</CardTitle>
                </div>
                <CardDescription>
                  Manage your account security and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Sign Out</h4>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your VeriEdit AI account
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Statistics & Billing */}
          <div className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle>Usage Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <Badge variant="secondary">
                      {monthlyUsage} / 5 Free
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((monthlyUsage / 5) * 100, 100)}%` }}
                    />
                  </div>
                  
                  {monthlyUsage >= 5 && (
                    <p className="text-xs text-trust-medium">
                      You've reached your free limit
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{verificationCount}</div>
                  <p className="text-sm text-muted-foreground">Total Verifications</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Subscription</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge variant="outline" className="mb-4">
                    Free Plan
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    5 verifications per month
                  </p>
                  
                  <Button className="w-full" size="sm">
                    Upgrade to Pro
                  </Button>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    $19/month • Unlimited verifications
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balance Section */}
            <WalletBalance />

            {/* Achievements Section */}
            <ProfileAchievements />

            {/* Social Section */}
            <FollowersList
              userId={user?.id || ''}
              followersCount={followersCount}
              followingCount={followingCount}
            />
          </div>
        </div>
      </main>
    </div>
  );

  return isMobile ? (
    <MobileOptimizedUI>{content}</MobileOptimizedUI>
  ) : (
    content
  );
};

export default Profile;