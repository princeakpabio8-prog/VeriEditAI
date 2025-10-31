import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Clock, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface BountyClaim {
  id: string;
  bounty_id: string;
  status: string;
  deadline: string;
  claimed_at: string;
  notes: string | null;
  bounty: {
    claim_to_verify: string;
    category: string;
    reward_amount: number;
    payment_type: string;
  };
}

export function MyBountyClaims() {
  const [claims, setClaims] = useState<BountyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bounty_claims')
        .select(`
          *,
          bounty:truth_bounties(claim_to_verify, category, reward_amount, payment_type)
        `)
        .eq('verifier_id', user.id)
        .in('status', ['in_progress', 'submitted'])
        .order('deadline', { ascending: true });

      if (error) throw error;
      setClaims(data || []);
    } catch (error: any) {
      console.error('Error fetching claims:', error);
      toast({
        title: 'Failed to load claims',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) return { status: 'overdue', color: 'destructive' };
    if (hoursLeft < 24) return { status: 'urgent', color: 'warning' };
    return { status: 'active', color: 'default' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Claimed Bounties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Claimed Bounties</CardTitle>
          <CardDescription>You haven't claimed any bounties yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/bounties')}>
            <Target className="h-4 w-4 mr-2" />
            Browse Bounties
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          My Claimed Bounties ({claims.length})
        </CardTitle>
        <CardDescription>Track your in-progress verifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {claims.map((claim) => {
          const deadlineInfo = getDeadlineStatus(claim.deadline);
          const timeLeft = formatDistanceToNow(new Date(claim.deadline), { addSuffix: true });

          return (
            <Card key={claim.id} className="border-2">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {claim.bounty.category}
                      </Badge>
                      <p className="font-semibold line-clamp-2">{claim.bounty.claim_to_verify}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">Reward</div>
                      <div className="text-lg font-bold text-primary">
                        ${claim.bounty.reward_amount}
                      </div>
                    </div>
                  </div>

                  {/* Status & Deadline */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className={deadlineInfo.status === 'overdue' ? 'text-destructive font-semibold' : ''}>
                        {timeLeft}
                      </span>
                    </div>
                    <Badge variant={deadlineInfo.status === 'urgent' ? 'destructive' : 'secondary'}>
                      {claim.status === 'submitted' ? 'Under Review' : 'In Progress'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {claim.status === 'in_progress' && (
                      <Button
                        onClick={() => navigate(`/verify?bountyClaimId=${claim.id}&bountyId=${claim.bounty_id}`)}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Continue Verification
                      </Button>
                    )}
                    {claim.status === 'submitted' && (
                      <Button variant="outline" className="flex-1" disabled>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Awaiting Organization Approval
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
