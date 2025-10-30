import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Award, CheckCircle2 } from "lucide-react";

interface Earning {
  id: string;
  reward_amount: number;
  service_fee: number;
  verifier_payout: number;
  payment_type: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
  truth_bounties: {
    title: string;
    category: string;
  };
}

export const BountyEarningsDashboard = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingPayouts: 0,
    completedBounties: 0,
  });

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bounty_earnings')
        .select('*, truth_bounties(title, category)')
        .eq('verifier_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEarnings(data || []);

      // Calculate stats
      const totalEarned = data?.reduce((sum, e) => sum + Number(e.verifier_payout), 0) || 0;
      const pending = data?.filter(e => e.payment_status === 'pending').reduce((sum, e) => sum + Number(e.verifier_payout), 0) || 0;
      const completed = data?.filter(e => e.payment_status === 'completed').length || 0;

      setStats({
        totalEarned,
        pendingPayouts: pending,
        completedBounties: completed,
      });
    } catch (error: any) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                <p className="text-3xl font-bold text-primary">${stats.totalEarned.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Payouts</p>
                <p className="text-3xl font-bold text-orange-500">${stats.pendingPayouts.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed Bounties</p>
                <p className="text-3xl font-bold text-green-500">{stats.completedBounties}</p>
              </div>
              <Award className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings List */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>Your bounty completion earnings and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No earnings yet. Complete bounties to start earning!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{earning.truth_bounties?.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {earning.truth_bounties?.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(earning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary mb-1">
                      ${Number(earning.verifier_payout).toFixed(2)}
                    </div>
                    <Badge
                      variant={earning.payment_status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {earning.payment_status === 'completed' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Paid
                        </>
                      ) : (
                        'Pending'
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};