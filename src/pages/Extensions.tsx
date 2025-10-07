import { Navigation } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Shield, 
  Zap, 
  CheckCircle, 
  Chrome,
  Puzzle,
  Key,
  HelpCircle,
  Lock,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/ui/footer';

const Extensions = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} />
      
      <main className="container mx-auto px-4 py-24 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Puzzle className="h-3 w-3 mr-1" />
            Browser Extension
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Verify Content Anywhere
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Install our powerful browser extension to verify content directly on social media platforms in real-time.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Download className="h-5 w-5" />
              Download Extension
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={user ? "/profile" : "/auth"}>
                <Key className="h-5 w-5 mr-2" />
                Get API Key
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-Time Verification</CardTitle>
              <CardDescription>
                Instantly verify any text or claim directly on social media platforms
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Trust Score System</CardTitle>
              <CardDescription>
                Get instant trust scores and credibility analysis for any content
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Badges</CardTitle>
              <CardDescription>
                Visual indicators show verification status right on the page
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Supported Platforms */}
        <Card className="mb-16 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Supported Platforms</CardTitle>
            <CardDescription>
              Verify content across major social media platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground mb-4">Available Now</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Twitter / X</span>
                    <Badge variant="secondary" className="ml-auto">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Facebook</span>
                    <Badge variant="secondary" className="ml-auto">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-primary" />
                    <span className="text-foreground">LinkedIn</span>
                    <Badge variant="secondary" className="ml-auto">Active</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground mb-4">Coming Soon</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="h-5 w-5 rounded bg-muted" />
                    <span className="text-muted-foreground">Instagram</span>
                    <Badge variant="outline" className="ml-auto">Soon</Badge>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="h-5 w-5 rounded bg-muted" />
                    <span className="text-muted-foreground">TikTok</span>
                    <Badge variant="outline" className="ml-auto">Soon</Badge>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="h-5 w-5 rounded bg-muted" />
                    <span className="text-muted-foreground">YouTube</span>
                    <Badge variant="outline" className="ml-auto">Soon</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Guide */}
        <Card className="mb-16 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Installation Guide</CardTitle>
            <CardDescription>
              Choose your browser and follow the steps below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chrome" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="chrome" className="gap-2">
                  <Chrome className="h-4 w-4" />
                  Chrome
                </TabsTrigger>
                <TabsTrigger value="firefox" className="gap-2">
                  <Puzzle className="h-4 w-4" />
                  Firefox
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chrome" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Download the Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the download button above or visit the Chrome Web Store
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Install & Pin</h4>
                      <p className="text-sm text-muted-foreground">
                        Click "Add to Chrome" and pin the extension to your toolbar for easy access
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Configure API Key</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the extension icon, go to settings, and paste your API key
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Start Verifying</h4>
                      <p className="text-sm text-muted-foreground">
                        Visit any supported platform and start verifying content!
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="firefox" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Download the Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the download button above or visit Firefox Add-ons
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Install Extension</h4>
                      <p className="text-sm text-muted-foreground">
                        Click "Add to Firefox" and approve the permissions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Configure API Key</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the extension icon, go to settings, and paste your API key
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Start Verifying</h4>
                      <p className="text-sm text-muted-foreground">
                        Visit any supported platform and start verifying content!
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* API Key Setup */}
        <Card className="mb-16 bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>API Key Setup</CardTitle>
            </div>
            <CardDescription>
              You need an API key to use the browser extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Generate your API key from your profile page and paste it in the extension settings.
                </p>
                <Button asChild>
                  <Link to="/profile">
                    Go to Profile & Generate API Key
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Sign in to your VeriEdit AI account to generate an API key for the extension.
                </p>
                <Button asChild>
                  <Link to="/auth">
                    Sign In to Get API Key
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-16 bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Is the extension free?</h4>
              <p className="text-sm text-muted-foreground">
                The extension itself is free. You can use it with any VeriEdit AI plan, including the free tier with 5 verifications per month.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">How do I get an API key?</h4>
              <p className="text-sm text-muted-foreground">
                Sign in to your VeriEdit AI account, go to your Profile page, and generate an API key from the API Keys section.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Which browsers are supported?</h4>
              <p className="text-sm text-muted-foreground">
                Currently, we support Chrome, Firefox, Edge, and other Chromium-based browsers. Safari support is coming soon.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Does the extension track my browsing?</h4>
              <p className="text-sm text-muted-foreground">
                No. The extension only activates on supported social media platforms and only when you explicitly request content verification.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>
              Your privacy and security are our top priorities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-foreground mb-1">No Data Collection</h5>
                  <p className="text-sm text-muted-foreground">
                    We don't collect or store your browsing history
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-foreground mb-1">Encrypted Communication</h5>
                  <p className="text-sm text-muted-foreground">
                    All data is transmitted using secure HTTPS
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-foreground mb-1">Open Permissions</h5>
                  <p className="text-sm text-muted-foreground">
                    We only request necessary permissions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-foreground mb-1">API Key Security</h5>
                  <p className="text-sm text-muted-foreground">
                    Your API key is stored locally and encrypted
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Extensions;