import { Link } from "react-router-dom";
import { ExternalLink, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">VeriEdit AI</h3>
            <p className="text-sm text-muted-foreground">
              Trust Infrastructure for the AI Era. Advanced AI-powered fact verification 
              and content authenticity solutions.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong className="text-foreground">VeriEdit AI Technologies Ltd</strong></p>
              <p>Founded by Prince Akpabio Esien</p>
              <p>
                <a href="tel:+2348080189816" className="hover:text-foreground transition-colors">
                  +234 808 018 9816
                </a>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Platform</h4>
            <div className="space-y-2 text-sm">
              <Link to="/verify" className="block text-muted-foreground hover:text-foreground transition-colors">
                Verify Content
              </Link>
              <Link to="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/extensions" className="block text-muted-foreground hover:text-foreground transition-colors">
                Browser Extension
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <a 
                href="https://heallink-app.lovable.app" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className="h-3 w-3 text-pink-500" />
                HealLink <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Account Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <div className="space-y-2 text-sm">
              <Link to="/profile" className="block text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
              <Link to="/billing" className="block text-muted-foreground hover:text-foreground transition-colors">
                Billing
              </Link>
              <Link to="/license" className="block text-muted-foreground hover:text-foreground transition-colors">
                License
              </Link>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <div className="space-y-2 text-sm">
              <a 
                href="https://www.verieditai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                Official Website <ExternalLink className="h-3 w-3" />
              </a>
              <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                Leadership Team
              </Link>
              <a 
                href="mailto:hello@verieditai.com"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <div className="space-y-2 text-sm">
              <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/refund-policy" className="block text-muted-foreground hover:text-foreground transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 VeriEdit AI Technologies Ltd. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Founder & CEO: Prince Akpabio Esien
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;