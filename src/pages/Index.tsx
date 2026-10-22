import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { EditorialNavigation } from "@/components/ui/editorial-navigation";
import { HeroSection } from "@/components/hero-section";
import { VerificationUpload } from "@/components/verification-upload";
import { VoiceInfrastructureSection } from "@/components/voice/VoiceInfrastructureSection";
import { Button } from "@/components/ui/button";
import Footer from "@/components/ui/footer";
import { ArrowUpRight, ArrowRight, Check, Radio, Award, FileSearch } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LiveActivityWidget = lazy(() => import("@/components/LiveActivityWidget").then(m => ({ default: m.LiveActivityWidget })));

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.hash === "#voice-infrastructure") {
      const target = document.getElementById("voice-infrastructure");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);
  const handleVerificationStart = (data: Parameters<NonNullable<React.ComponentProps<typeof VerificationUpload>["onVerificationStart"]>>[0]) => {
    sessionStorage.setItem("pendingVerification", JSON.stringify(data));
    navigate(user ? "/dashboard" : "/auth");
  };

  return (
    <div className="editorial-home min-h-screen bg-background text-foreground">
      <EditorialNavigation />
      <main>
        <HeroSection />
        <section id="verify" className="border-b border-border px-5 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_1.4fr] md:gap-16">
            <div>
              <p className="mb-4 text-xs uppercase text-accent">01 / The evidence desk</p>
              <h2 className="max-w-sm text-3xl font-medium leading-tight sm:text-4xl">AI fact-checking.<br />Start with the evidence.</h2>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">Check a claim, an article, or a document. Look beyond the headline to the sources behind it.</p>
              <p className="mt-6 max-w-sm border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted-foreground">A trust score is a starting point, not the final word. Read the evidence and make your own judgment.</p>
            </div>
            <div className="editorial-verification min-w-0"><VerificationUpload onVerificationStart={handleVerificationStart} /></div>
          </div>
        </section>
        <section id="features" className="border-b border-border px-5 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div><p className="mb-4 text-xs uppercase text-accent">02 / Beyond the headline</p><h2 className="text-3xl font-medium sm:text-4xl">Follow the conversation.</h2></div>
              <Button asChild variant="link" className="px-0"><Link to="/viral-claims">Browse current claims <ArrowUpRight /></Link></Button>
            </div>
            <div className="grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
              {[{ icon: FileSearch, title: "Claims under review", copy: "Explore what is circulating and examine the evidence.", path: "/viral-claims", label: "View claims" }, { icon: Radio, title: "The Lighthouse", copy: "A place for considered discussion and shared discovery.", path: "/lighthouse", label: "Enter the community" }, { icon: Award, title: "Truth Badge", copy: "Your place in the VeriEdit community starts here.", path: "/truth-badge", label: "Explore the badge" }].map(item => (
                <article key={item.path} className="py-7 md:px-7 md:first:pl-0 md:last:pr-0">
                  <item.icon className="mb-6 h-6 w-6 text-accent" strokeWidth={1.5} />
                  <h3 className="mb-3 text-xl font-medium">{item.title}</h3>
                  <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
                  <Button asChild variant="link" className="h-auto px-0"><Link to={item.path}>{item.label}<ArrowUpRight /></Link></Button>
                </article>
              ))}
            </div>
          </div>
        </section>
        <VoiceInfrastructureSection />
        <section id="pricing" className="border-b border-border px-5 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:gap-20">
            <div><p className="mb-4 text-xs uppercase text-accent">03 / Membership</p><h2 className="text-3xl font-medium sm:text-4xl">The Truth Badge.</h2><p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">This is not just access. It's your position inside the system.</p><Button asChild variant="link" className="mt-5 px-0"><Link to="/truth-badge">See membership details <ArrowRight /></Link></Button></div>
            <div className="border-t border-border pt-5"><div className="mb-6 flex items-baseline justify-between gap-4"><span className="text-sm">Whitelist open</span><span className="text-4xl font-medium">$4.99</span></div><ul className="space-y-4 text-sm">{["Elite Discord access", "Early feature access", "Priority support", "Trader upgrade access"].map(perk => <li key={perk} className="flex items-center gap-3"><Check className="h-4 w-4 text-accent" />{perk}</li>)}</ul><Button asChild size="lg" className="mt-7 h-12 w-full"><Link to="/truth-badge">Mint Truth Badge ($4.99)<ArrowUpRight /></Link></Button></div>
          </div>
        </section>
        <section id="about" className="px-5 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-4 text-xs uppercase text-accent">04 / The public record</p><h2 className="text-3xl font-medium sm:text-4xl">Recent verifications.</h2></div><Button asChild variant="link" className="px-0"><Link to="/activity-feed">View activity <ArrowUpRight /></Link></Button></div>
            <Suspense fallback={<div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}><LiveActivityWidget /></Suspense>
            <nav aria-label="More about VeriEdit AI" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About VeriEdit AI</Link>
              <Link to="/blog" className="text-muted-foreground hover:text-foreground">Verification journal</Link>
              <Link to="/extensions" className="text-muted-foreground hover:text-foreground">Browser extension</Link>
              <Link to="/api-docs" className="text-muted-foreground hover:text-foreground">Verification API</Link>
            </nav>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
export default Index;
