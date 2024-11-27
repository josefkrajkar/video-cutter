import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Slider } from '~/components/ui/slider';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Play, Pause } from 'lucide-react';

const FPS = 30;

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
    if (!videoRef.current || !video) return;
    setIsProcessing(true);

    try {
      // Create a new video element for recording
      const recordingVideo = document.createElement('video');
      recordingVideo.src = videoUrl;
      await new Promise((resolve) => {
        recordingVideo.onloadedmetadata = resolve;
      });

      // Set the starting point
      recordingVideo.currentTime = trimRange[0];
      await new Promise((resolve) => {
        recordingVideo.onseeked = resolve;
      });

      // Get the video stream
      const stream = recordingVideo.captureStream();
      
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')
        ? 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
        : 'video/webm;codecs=vp9';

      // Create MediaRecorder with proper settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps for good quality
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const originalName = video.name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}-trimmed.mp4`;
        a.click();
        URL.revokeObjectURL(url);
        setIsProcessing(false);
      };

      // Start recording
      mediaRecorder.start(100); // Record in 100ms chunks
      recordingVideo.play();

      // Stop recording when we reach the end point
      recordingVideo.addEventListener('timeupdate', () => {
        if (recordingVideo.currentTime >= trimRange[1]) {
          recordingVideo.pause();
          mediaRecorder.stop();
          recordingVideo.remove();
        }
      });
    } catch (error) {
      console.error('Error during video export:', error);
      setIsProcessing(false);
      alert('An error occurred while exporting the video. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-4xl p-4">
      <CardHeader>
        <CardTitle>Video Cutter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          
          {videoUrl && (
            <div className="space-y-6">
              <div className="aspect-video bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                >
                  <track kind="captions" />
                </video>
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlayPause}
                  className="w-12 h-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Slider
                  value={[trimRange[0], trimRange[1]]}
                  min={0}
                  max={duration}
                  step={1/FPS}
                  onValueChange={handleTrimRangeChange}
                  className="my-4"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(trimRange[0])}</span>
                  <span>{formatTime(trimRange[1])}</span>
                </div>
              </div>
              
              {estimatedSize && (
                <div className="text-sm text-gray-600 text-center">
                  Estimated output size: {estimatedSize}
                </div>
              )}
              
              <Button 
                onClick={exportVideo} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Export Trimmed Video'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCutter;
