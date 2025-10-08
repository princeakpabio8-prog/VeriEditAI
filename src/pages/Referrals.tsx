import { Navigation } from "@/components/ui/navigation";
import { ReferralSystem } from "@/components/referral-system";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Referrals() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Invite friends and earn free verifications
          </p>
        </div>
        
        <ReferralSystem />
      </main>
    </div>
  );
}
