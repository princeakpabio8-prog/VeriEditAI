import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import lighthouseEditorial from "@/assets/lighthouse-editorial.jpg";

export const HeroSection = () => (
  <section className="border-b border-border pt-16">
    <div className="mx-auto max-w-7xl px-5 pb-5 pt-6 sm:px-8 sm:pb-10 sm:pt-12">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-3 text-xs uppercase text-muted-foreground">
        <span>Independent thinking. Informed trust.</span>
        <span className="hidden sm:block">Verification / Community / Access</span>
      </div>
      <h1 className="text-5xl font-medium leading-none sm:text-7xl lg:text-8xl">VeriEdit AI<span className="text-accent">.</span></h1>
      <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <p className="max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">Less noise. More evidence.<br />A clearer view of what deserves your trust.</p>
        <Button size="lg" className="h-12 w-fit px-6" onClick={() => document.getElementById("verify")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>Verify a claim <ArrowRight /></Button>
      </div>
    </div>
    <figure className="relative">
      <img src={lighthouseEditorial} alt="A white lighthouse overlooking a quiet rocky coastline" width={1536} height={768} fetchPriority="high" className="h-[140px] w-full object-cover object-right-top sm:h-[260px] lg:h-[300px]" />
    </figure>
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 text-xs text-muted-foreground sm:px-8">
      <span>A signal worth following.</span>
      <a href="#verify" className="flex items-center gap-2 text-foreground">Start with the evidence <ArrowDown className="h-3 w-3" /></a>
    </div>
  </section>
);
