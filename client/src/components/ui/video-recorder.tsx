import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Play, Archive, Square, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { useVideoRecorder } from '@/hooks/use-video-recorder';

type VideoRecorderProps = {
  onVideoSaved: (videoBlob: Blob, thumbnailBlob?: Blob) => void;
  maxDuration?: number; // in seconds
};

export default function VideoRecorder({ onVideoSaved, maxDuration = 60 }: VideoRecorderProps) {
  const { toast } = useToast();
  const {
    isRecording,
    isPreparing,
    videoStream,
    videoRef,
    startRecording,
    stopRecording,
    captureFrame,
    error
  } = useVideoRecorder({ maxDuration });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const timerRef = useRef<number | null>(null);

  // Handle errors
  if (error) {
    return (
      <Card className="w-full bg-red-50 border-red-200">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <Camera className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Camera Access Error</h3>
          <p className="text-sm text-red-600 mb-4">
            {error.message || "Unable to access your camera. Please ensure you've granted the necessary permissions."}
          </p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (success) {
      setTimeLeft(maxDuration);
      setIsPlaying(false);
      
      // Start countdown timer
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleStopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    stopRecording(async (blob) => {
      if (blob) {
        setRecordedBlob(blob);
        
        // Capture thumbnail
        const thumbnail = await captureFrame();
        if (thumbnail) {
          setThumbnailBlob(thumbnail);
        }
      }
    });
  }, [stopRecording, captureFrame]);

  const handleVideoPlayback = () => {
    if (videoRef.current && recordedBlob) {
      videoRef.current.src = URL.createObjectURL(recordedBlob);
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
        toast({
          title: "Playback Failed",
          description: "There was an error playing back your recording.",
          variant: "destructive"
        });
      });
      setIsPlaying(true);
    }
  };

  const handleSaveVideo = () => {
    if (recordedBlob) {
      onVideoSaved(recordedBlob, thumbnailBlob || undefined);
    }
  };

  const handleDiscard = () => {
    setRecordedBlob(null);
    setThumbnailBlob(null);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full">
      <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay={videoStream !== null}
        />
        
        {isPreparing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-center space-x-3">
        {!recordedBlob ? (
          <>
            <Button
              onClick={handleStartRecording}
              disabled={isRecording || isPreparing}
              className="bg-primary hover:bg-primary/90"
            >
              {isRecording ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            
            {isRecording && (
              <Button
                onClick={handleStopRecording}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={handleVideoPlayback}
              variant="secondary"
              disabled={isPlaying}
            >
              <Play className="h-4 w-4 mr-2" />
              {isPlaying ? "Playing..." : "Preview"}
            </Button>
            
            <Button
              onClick={handleSaveVideo}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Save Video
            </Button>
            
            <Button
              onClick={handleDiscard}
              variant="outline"
            >
              Discard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
