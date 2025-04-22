import { useRef, useState, useEffect } from 'react';
import { Loader2, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

type VideoPlayerProps = {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  showControls?: boolean;
  onError?: (error: any) => void;
};

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  className,
  showControls = true,
  onError
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      setIsError(true);
      setIsLoading(false);
      if (onError) onError(e);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [onError]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
        setIsError(true);
        if (onError) onError(err);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-gray-900", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        onClick={showControls ? togglePlay : undefined}
      />
      
      {isLoading && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
          <div className="text-center">
            <div className="bg-red-500/20 p-3 rounded-full mb-2 mx-auto w-fit">
              <Volume2 className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-sm">Failed to load video</p>
          </div>
        </div>
      )}
      
      {showControls && !isError && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center">
          <button 
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
          >
            {isPlaying ? (
              <div className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <Play className="h-3 w-3 text-white" fill="white" />
            )}
          </button>
          
          <button 
            onClick={toggleMute}
            className="bg-white/20 hover:bg-white/30 rounded-full p-2 ml-2 transition"
          >
            {isMuted ? (
              <VolumeX className="h-3 w-3 text-white" />
            ) : (
              <Volume2 className="h-3 w-3 text-white" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
