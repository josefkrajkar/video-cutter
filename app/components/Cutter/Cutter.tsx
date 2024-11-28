import React, { useRef, useState, useEffect, useCallback } from 'react';
import CutterView from './components/View';
import { trimVideo } from './utils/helpers';

// Type declaration for HTMLVideoElement with captureStream
declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
}

const VideoCutter = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateEstimatedSize = useCallback(() => {
    if (!video || !duration) return;
    
    const trimDuration = trimRange[1] - trimRange[0];
    const ratio = trimDuration / duration;
    const estimatedBytes = video.size * ratio;
    
    setEstimatedSize(formatFileSize(estimatedBytes));
  }, [video, duration, trimRange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'video/mp4') {
      setVideo(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setIsPlaying(false);
    } else {
      alert('Please select an MP4 video file');
    }
  };

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.onloadedmetadata = () => {
        const videoDuration = videoRef.current?.duration || 0;
        setDuration(videoDuration);
        setTrimRange([0, videoDuration]);
      };
    }
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    calculateEstimatedSize();
  }, [calculateEstimatedSize]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime < trimRange[0] || videoRef.current.currentTime > trimRange[1]) {
        videoRef.current.currentTime = trimRange[0];
      }
    }
  };

  const handleTrimRangeChange = (values: number[]) => {
    setTrimRange([values[0], values[1]]);
    if (videoRef.current) {
      videoRef.current.currentTime = values[0];
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (videoRef.current.currentTime < trimRange[0] || videoRef.current.currentTime > trimRange[1]) {
        videoRef.current.currentTime = trimRange[0];
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;

    const handleEnded = () => {
      if (ref) {
        ref.currentTime = trimRange[0];
        setIsPlaying(false);
      }
    };

    const handleTimeUpdateForLoop = () => {
      if (ref && ref.currentTime >= trimRange[1]) {
        ref.currentTime = trimRange[0];
        setIsPlaying(false);
        ref.pause();
      }
    };

    ref.addEventListener('ended', handleEnded);
    ref.addEventListener('timeupdate', handleTimeUpdateForLoop);

    return () => {
      if (ref) {
        ref.removeEventListener('ended', handleEnded);
        ref.removeEventListener('timeupdate', handleTimeUpdateForLoop);
      }
    };
  }, [trimRange]);

  const exportVideo = async () => {
    if (!video || !trimRange[0] || !trimRange[1]) return;
    setIsProcessing(true);
    await trimVideo(video, trimRange[0], trimRange[1]);
    setIsProcessing(false);
  };

  return (
    <CutterView
      videoUrl={videoUrl}
      duration={duration}
      trimRange={trimRange}
      isPlaying={isPlaying}
      handleFileChange={handleFileChange}
      handleTimeUpdate={handleTimeUpdate}
      togglePlayPause={togglePlayPause}
      handleTrimRangeChange={handleTrimRangeChange}
      exportVideo={exportVideo}
      estimatedSize={estimatedSize}
      isProcessing={isProcessing}
      formatTime={formatTime}
      videoRef={videoRef}
    />
  );
};

export default VideoCutter;
