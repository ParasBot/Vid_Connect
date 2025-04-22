import { useState, useRef, useEffect, useCallback } from 'react';

type VideoRecorderOptions = {
  maxDuration?: number; // in seconds
  onTimeUpdate?: (currentTime: number) => void;
};

export function useVideoRecorder({ 
  maxDuration = 60,
  onTimeUpdate 
}: VideoRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Initialize video stream
  const initializeStream = useCallback(async () => {
    setIsPreparing(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to access camera and microphone'));
      return false;
    } finally {
      setIsPreparing(false);
    }
  }, []);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [videoStream]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording) return false;
    
    // Initialize stream if not already
    if (!videoStream) {
      const success = await initializeStream();
      if (!success) return false;
    }
    
    try {
      chunksRef.current = [];
      
      if (!videoStream) {
        throw new Error("Video stream not available");
      }
      
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const mediaRecorder = new MediaRecorder(videoStream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Set timer to stop recording after maxDuration
      timerRef.current = window.setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, maxDuration * 1000);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start recording'));
      return false;
    }
  }, [isRecording, videoStream, maxDuration, initializeStream]);

  // Stop recording
  const stopRecording = useCallback((callback?: (blob: Blob | null) => void) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (!isRecording || !mediaRecorderRef.current) {
      if (callback) callback(null);
      return;
    }
    
    mediaRecorderRef.current.onstop = () => {
      try {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          if (callback) callback(blob);
        } else {
          if (callback) callback(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to process recording'));
        if (callback) callback(null);
      }
      
      setIsRecording(false);
    };
    
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  // Capture a frame from the video stream for thumbnail
  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current) return null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      });
    } catch (err) {
      console.error('Failed to capture frame:', err);
      return null;
    }
  }, []);

  return {
    videoRef,
    videoStream,
    isRecording,
    isPreparing,
    error,
    startRecording,
    stopRecording,
    captureFrame,
    initializeStream
  };
}
