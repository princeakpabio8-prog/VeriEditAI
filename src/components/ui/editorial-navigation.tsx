import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import lighthouseLogo from "@/assets/lighthouse-logo.png";

export function EditorialNavigation() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label="VeriEdit AI home"><img src={lighthouseLogo} alt="VeriEdit AI" className="h-9 w-9 rounded-md" width={36} height={36} /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm md:flex">
          <Link to="/viral-claims" className="text-muted-foreground hover:text-foreground">Claims</Link>
          <Link to="/lighthouse" className="text-muted-foreground hover:text-foreground">Lighthouse</Link>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground">Journal</Link>
          <Link to="/truth-badge" className="text-muted-foreground hover:text-foreground">Truth Badge</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to={user ? "/dashboard" : "/auth"}>{user ? "My account" : "Sign in"}<ArrowUpRight /></Link></Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="editorial-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {open && <nav id="editorial-menu" aria-label="Mobile navigation" className="grid border-t border-border px-5 py-3 md:hidden">
        {[["Verify content", "/verify"], ["Claims", "/viral-claims"], ["Lighthouse", "/lighthouse"], ["Journal", "/blog"], ["Truth Badge", "/truth-badge"], ["About us", "/about"]].map(([label, to]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="border-b border-border py-3 text-sm last:border-0">{label}</Link>)}
      </nav>}
    </header>
  );
}