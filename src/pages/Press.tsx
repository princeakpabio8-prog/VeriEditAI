import { useEffect, useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { DynamicMeta } from '@/components/DynamicMeta';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Mail, ExternalLink, TrendingUp, Users, CheckCircle2, Globe } from 'lucide-react';

interface PublicStats {
  totalVerifications: number;
  averageTrustScore: number;
  activeUsers: number;
  countriesServed: number;
}

export default function Press() {
  const [stats, setStats] = useState<PublicStats>({
    totalVerifications: 0,
    averageTrustScore: 0,
    activeUsers: 0,
    countriesServed: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // This would call the public-stats edge function
    // For now, using placeholder data
    setStats({
      totalVerifications: 125000,
      averageTrustScore: 87,
      activeUsers: 15000,
      countriesServed: 45
    });
  };

  return (
    <>
      <DynamicMeta
        title="Press Kit - VeriEdit AI | Media Resources & Company Information"
        description="Download VeriEdit AI press kit with logos, media resources, company facts, and contact information for journalists and media professionals."
        image="https://verieditai.com/assets/lighthouse-hero.jpg"
      />
      
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Press & Media</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Press Kit
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about VeriEdit AI
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              <Card className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.totalVerifications.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Verifications</div>
              </Card>
              <Card className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.averageTrustScore}%</div>
                <div className="text-sm text-muted-foreground">Avg Trust Score</div>
              </Card>
              <Card className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </Card>
              <Card className="p-6 text-center">
                <Globe className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.countriesServed}+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </Card>
            </div>

            {/* Company Info */}
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">Company Fact Sheet</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">About VeriEdit AI</h3>
                  <p className="text-muted-foreground">
                    VeriEdit AI is a next-generation AI-powered verification platform that helps individuals and organizations 
                    verify claims, detect misinformation, and build trust in the digital age. Founded in 2024, we're on a mission 
                    to create trust infrastructure for the AI era.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Mission</h3>
                  <p className="text-muted-foreground">
                    To democratize access to truth verification and empower everyone to make informed decisions based on verified information.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>AI-powered claim verification with 95%+ accuracy</li>
                    <li>Real-time trust scoring and source reputation analysis</li>
                    <li>Collaborative verification through Lighthouse Rooms</li>
                    <li>Browser extension for instant verification</li>
                    <li>API access for enterprise integration</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Download Assets */}
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">Brand Assets</h2>
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-between">
                  Logo Pack (SVG, PNG)
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Brand Guidelines (PDF)
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Product Screenshots
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Founder Photo
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                All assets are available for editorial use. Please credit "VeriEdit AI" when using our materials.
              </p>
            </Card>

            {/* Media Contact */}
            <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 to-background border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Media Contact</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Press Inquiries</div>
                    <a href="mailto:media@verieditai.com" className="text-primary hover:underline">
                      media@verieditai.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Website</div>
                    <a href="https://verieditai.com" className="text-primary hover:underline">
                      verieditai.com
                    </a>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-6">
                <Mail className="mr-2 h-4 w-4" />
                Contact Press Team
              </Button>
            </Card>

            {/* Press Releases */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Latest Press Releases</h2>
              
              <div className="space-y-4">
                <div className="pb-4 border-b border-border">
                  <div className="text-sm text-muted-foreground mb-1">January 2025</div>
                  <h3 className="font-semibold mb-2">VeriEdit AI Launches Real-Time Verification Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    Next-generation AI platform helps combat misinformation with 95% accuracy rate
                  </p>
                </div>
                
                <p className="text-sm text-muted-foreground text-center py-4">
                  More press releases coming soon
                </p>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
