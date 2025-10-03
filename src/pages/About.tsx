import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Shield, Target, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="mb-4">About VeriEdit AI</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Trust Infrastructure for the AI Era
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Building the future of AI-powered fact verification and content authenticity
            </p>
          </div>

          {/* Founder Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Leadership
              </CardTitle>
              <CardDescription>Meet the visionary behind VeriEdit AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Prince Akpabio Esien
                </h3>
                <Badge variant="secondary" className="mb-4">Founder & CEO</Badge>
                <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Prince Akpabio Esien is the visionary founder and CEO of VeriEdit AI, 
                  leading the development of cutting-edge AI technologies for content verification 
                  and trust infrastructure. With a passion for combating misinformation and 
                  building reliable AI systems, Prince drives VeriEdit AI's mission to create 
                  a more trustworthy digital information ecosystem.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why We Exist - Video Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Why We Exist
              </CardTitle>
              <CardDescription>Hear our mission in 7 minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/LpIkzJ4C-aI"
                  title="VeriEdit AI - Why We Exist"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  aria-label="Interview with the founder explaining VeriEdit AI's mission"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Mission */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To democratize access to reliable fact-checking technology and build 
                  robust trust infrastructure that empowers users to verify information 
                  accuracy in real-time, creating a more informed and trustworthy digital world.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To become the global standard for AI-powered content verification, 
                  enabling organizations and individuals to confidently navigate the 
                  information landscape with advanced trust scoring and verification technologies.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technology & Innovation */}
          <Card>
            <CardHeader>
              <CardTitle>Innovation at the Core</CardTitle>
              <CardDescription>
                Advanced AI technologies powering next-generation verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">AI-Powered Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced machine learning models for content verification
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Real-time Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Instant verification with sub-second response times
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Trust Infrastructure</h4>
                  <p className="text-sm text-muted-foreground">
                    Scalable platform for enterprise-grade verification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                Have questions or want to learn more about VeriEdit AI?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">Contact us at</p>
                <a 
                  href="mailto:hello@verieditai.com"
                  className="text-lg font-semibold text-primary hover:underline inline-block"
                >
                  hello@verieditai.com
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Ready to Experience Trust Infrastructure?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join thousands of users who trust VeriEdit AI for reliable content verification
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/verify">Start Verification</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a 
                  href="https://www.verieditai.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Visit VeriEdit AI <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;