import { useState, useRef, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // Handle autoplay restrictions on mobile
          console.log('Autoplay was prevented');
        });
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
                onMouseEnter={() => !isMobile && setShowControls(true)}
                onMouseLeave={() => !isMobile && setShowControls(false)}
                onClick={() => isMobile && setShowControls(!showControls)}
              >
                {videoError ? (
                  <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center p-8">
                      <p className="text-muted-foreground mb-4">Video preview not available</p>
                      <Button onClick={handleWatchFull} variant="outline">
                        Watch Full Demo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full aspect-video object-contain bg-black rounded-lg cursor-pointer"
                    src="/assets/demo-video.mp4"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedData={() => setVideoLoaded(true)}
                    onError={() => {
                      console.log('Video failed to load on mobile');
                      setVideoError(true);
                    }}
                    preload={isMobile ? "none" : "metadata"}
                    playsInline
                    muted={isMobile} // Start muted on mobile to help with autoplay
                    onClick={isMobile ? togglePlay : undefined}
                    onLoadedMetadata={() => {
                      if (videoRef.current && !isMobile) {
                        videoRef.current.volume = 0.7;
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                {/* Video Overlay */}
                {(!isPlaying || showControls || isMobile) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300">
                    <div className={`flex items-center gap-4 ${isMobile ? 'gap-6' : 'gap-4'}`}>
                      <Button
                        onClick={togglePlay}
                        size={isMobile ? "lg" : "lg"}
                        className={`bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg ${isMobile ? 'h-16 w-16 rounded-full' : ''}`}
                      >
                        {isPlaying ? (
                          <Pause className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'}`} />
                        ) : (
                          <Play className={`${isMobile ? 'h-10 w-10 ml-1' : 'h-8 w-8 ml-1'}`} />
                        )}
                      </Button>
                      
                      <Button
                        onClick={toggleMute}
                        size={isMobile ? "lg" : "lg"}
                        variant="secondary"
                        className={`bg-background/90 hover:bg-background text-foreground shadow-lg ${isMobile ? 'h-16 w-16 rounded-full' : ''}`}
                      >
                        {isMuted ? (
                          <VolumeX className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'}`} />
                        ) : (
                          <Volume2 className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'}`} />
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