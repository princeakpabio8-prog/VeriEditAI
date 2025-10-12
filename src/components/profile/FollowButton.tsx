import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const FollowButton = ({ targetUserId, variant = "outline", size = "default" }: FollowButtonProps) => {
  const { user } = useAuth();
  const { isFollowing, loading, toggleFollow } = useFollow(targetUserId, user?.id);

  if (!user || user.id === targetUserId) return null;

  return (
    <Button
      variant={isFollowing ? "ghost" : variant}
      size={size}
      onClick={toggleFollow}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
};
