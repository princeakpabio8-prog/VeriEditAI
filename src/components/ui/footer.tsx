import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">VeriEdit AI</h3>
            <p className="text-sm text-muted-foreground">
              Trust Infrastructure for the AI Era. Advanced AI-powered fact verification 
              and content authenticity solutions.
            </p>
            <p className="text-xs text-muted-foreground">
              Founded by Prince Akpabio Esien
            </p>
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
              <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
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
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 VeriEdit AI. All rights reserved. Built with trust infrastructure technology.
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