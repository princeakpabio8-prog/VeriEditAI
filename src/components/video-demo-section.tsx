import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const VideoDemoSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

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

  const handleStartVerification = () => {
    if (user) {
      navigate('/verify');
    } else {
      navigate('/auth');
    }
  };

  const handleWatchFull = () => {
    navigate('/demo');
  };

  return (
    <section id="demo-video" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch how our AI-powered verification works in real-time to detect misinformation and validate content
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden shadow-2xl border-border/50">
            <CardContent className="p-0">
              <div 
                className="relative group"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-contain bg-black rounded-lg"
                  src="/assets/demo-video.mp4"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  poster="/placeholder.svg"
                  preload="metadata"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.volume = 0.7;
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Video Overlay */}
                {(!isPlaying || showControls) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={togglePlay}
                        size="lg"
                        className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
                      >
                        {isPlaying ? (
                          <Pause className="h-8 w-8" />
                        ) : (
                          <Play className="h-8 w-8 ml-1" />
                        )}
                      </Button>
                      
                      <Button
                        onClick={toggleMute}
                        size="lg"
                        variant="secondary"
                        className="bg-background/90 hover:bg-background text-foreground shadow-lg"
                      >
                        {isMuted ? (
                          <VolumeX className="h-6 w-6" />
                        ) : (
                          <Volume2 className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Call-to-action overlay */}
                <div className="absolute top-4 right-4">
                  <Button
                    onClick={handleWatchFull}
                    variant="secondary"
                    size="sm"
                    className="bg-background/90 hover:bg-background text-foreground border border-border/50"
                  >
                    Full Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              onClick={handleStartVerification}
              size="lg"
              className="group"
            >
              Try Verification Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={handleWatchFull}
              variant="outline"
              size="lg"
            >
              Watch Complete Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};