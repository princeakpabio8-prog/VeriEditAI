import { Navigation } from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { usePWA } from "@/hooks/use-pwa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Zap, Shield, Wifi, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const Install = () => {
  const { isInstallable, isInstalled, installApp, getInstallInstructions } = usePWA();

  const features = [
    { icon: Zap, title: "Instant Access", desc: "Launch from your home screen — no browser needed" },
    { icon: Wifi, title: "Works Offline", desc: "Verify content even without internet connection" },
    { icon: Shield, title: "Secure & Private", desc: "Same security as the web app, runs in its own window" },
    { icon: Smartphone, title: "Native Feel", desc: "Full-screen experience with no address bar" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Download className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Install VeriEdit AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Get the full app experience on your device. Free, instant, no app store needed.
          </p>

          {isInstalled ? (
            <Card className="border-trust-high/30 bg-trust-high/5">
              <CardContent className="flex items-center gap-3 p-4 justify-center">
                <CheckCircle className="h-5 w-5 text-trust-high" />
                <span className="text-sm font-medium text-foreground">
                  VeriEdit AI is already installed on this device!
                </span>
              </CardContent>
            </Card>
          ) : isInstallable ? (
            <Button size="lg" onClick={installApp} className="text-lg px-8 py-6">
              <Download className="h-5 w-5 mr-2" />
              Install Now
            </Button>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {getInstallInstructions()}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/30 bg-card/50">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">How to Install Manually</h2>
          <div className="space-y-3 text-sm text-muted-foreground max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</span>
              <p className="text-left"><strong className="text-foreground">iPhone/iPad:</strong> Tap Share ↗ → "Add to Home Screen"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</span>
              <p className="text-left"><strong className="text-foreground">Android:</strong> Tap ⋮ menu → "Add to Home Screen" or "Install App"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">3</span>
              <p className="text-left"><strong className="text-foreground">Desktop Chrome:</strong> Click the install icon ⊕ in the address bar</p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
