import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <motion.div 
          className="text-center max-w-md mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated 404 */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-trust bg-clip-text text-transparent">
              404
            </h1>
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page <code className="text-sm bg-muted px-2 py-1 rounded">{location.pathname}</code> doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/verify">
                <Search className="h-4 w-4" />
                Verify Content
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-4">
            If you think this is an error, please contact us at{" "}
            <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">
              hello@verieditai.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;