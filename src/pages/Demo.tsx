import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Demo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setVideoEnded(false);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setVideoEnded(true);
  };

  const handleStartVerification = () => {
    if (user) {
      navigate('/verify');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
            Product Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            See how our AI-powered verification system works in real-time. 
            Watch this comprehensive demonstration of our trust infrastructure capabilities.
          </p>
        </section>

        {/* Video Player Section */}
        <section className="max-w-6xl mx-auto mb-12">
          <Card className="overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div 
                className="relative group"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  src="/assets/demo-video.mp4"
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleVideoEnd}
                  poster="/placeholder.svg"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>

                {/* Video Overlay */}
                {(!isPlaying || showControls) && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300">
                    {videoEnded ? (
                      <div className="text-center">
                        <Button
                          onClick={restartVideo}
                          size="lg"
                          className="mb-4 bg-primary/90 hover:bg-primary text-primary-foreground"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Watch Again
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={togglePlay}
                        size="lg"
                        className="bg-primary/90 hover:bg-primary text-primary-foreground"
                      >
                        {isPlaying ? (
                          <Pause className="h-8 w-8" />
                        ) : (
                          <Play className="h-8 w-8 ml-1" />
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Custom Controls */}
                {showControls && !videoEnded && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between bg-black/70 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={togglePlay}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          onClick={toggleMute}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action Section */}
        <section className="text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Verifying?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience the power of AI-driven fact-checking and content verification. 
              Join thousands of users who trust our platform for accurate information.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartVerification}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Start Verification
              </Button>
              
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="lg"
              >
                View Dashboard
              </Button>
              
              <Button
                onClick={() => navigate('/about')}
                variant="ghost"
                size="lg"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="mt-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced machine learning algorithms analyze content for accuracy and reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
                <p className="text-muted-foreground">
                  Get instant verification results with detailed confidence scores and explanations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Trusted Sources</h3>
                <p className="text-muted-foreground">
                  Cross-reference multiple authoritative sources for comprehensive fact-checking.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;