import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, Users, Gift, Mail, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import QRCode from "qrcode";

interface ReferralStats {
  total_referrals: number;
  bonus_verifications: number;
  referral_code: string;
  pending_referrals: number;
  completed_referrals: number;
}

export function ReferralSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_referral_stats', {
        user_uuid: user.id
      });

      if (error) throw error;

      const statsData = data as unknown as ReferralStats;
      setStats(statsData);

      // Generate QR code
      const referralUrl = getReferralUrl(statsData.referral_code);
      const qr = await QRCode.toDataURL(referralUrl);
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = (code: string) => {
    return `${window.location.origin}/auth?ref=${code}`;
  };

  const copyReferralLink = () => {
    if (!stats) return;

    const url = getReferralUrl(stats.referral_code);
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareOnTwitter = () => {
    if (!stats) return;

    const url = getReferralUrl(stats.referral_code);
    const text = `I'm using VeriedIT AI to fight misinformation! Join me and get 5 free verifications. 🎁`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!stats) return;

    const url = getReferralUrl(stats.referral_code);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    if (!stats) return;

    const url = getReferralUrl(stats.referral_code);
    const text = `Check out VeriedIT AI - AI-powered fact checking! Use my referral code to get 5 free verifications: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendEmailInvite = async () => {
    if (!email || !stats) return;

    try {
      // Create referral record
      await supabase.from('referrals').insert({
        referrer_id: user!.id,
        referral_code: stats.referral_code,
        referred_email: email,
        status: 'pending'
      });

      toast({
        title: "Invite Sent!",
        description: `We'll notify ${email} about VeriedIT AI`,
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!stats) {
    return <div>Error loading referral data</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share your code and earn 10 free verifications for each friend who signs up!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={stats.referral_code}
              readOnly
              className="font-mono text-lg text-center"
            />
            <Button onClick={copyReferralLink} size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={getReferralUrl(stats.referral_code)}
              readOnly
              className="text-sm"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={shareOnTwitter} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button onClick={shareOnLinkedIn} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button onClick={shareOnWhatsApp} variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          {qrCodeUrl && (
            <div className="flex justify-center pt-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite by Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={sendEmailInvite}>Send Invite</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referral Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">{stats.total_referrals}</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">{stats.completed_referrals}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">{stats.pending_referrals}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">{stats.bonus_verifications}</div>
              <div className="text-sm text-muted-foreground">Bonus Credits</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="text-sm text-muted-foreground space-y-2">
            <p>🎁 Earn 10 free verifications for each friend who signs up</p>
            <p>🎉 Your friends get 5 bonus verifications when they use your code</p>
            <p>🚀 No limit on referrals - invite unlimited friends!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
