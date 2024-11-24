import React, { useRef, useState, useEffect } from 'react';
import { Slider } from '~/components/ui/slider';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

interface Resolution {
  label: string;
  width: number;
  height: number;
}

const VideoCutter = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState<number>(30);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const resolutions: Resolution[] = [
    { label: "Original", width: 0, height: 0 },
    { label: "1080p", width: 1920, height: 1080 },
    { label: "720p", width: 1280, height: 720 },
    { label: "480p", width: 854, height: 480 },
    { label: "360p", width: 640, height: 360 }
  ];
  
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(resolutions[0]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.onloadedmetadata = () => {
        const videoDuration = videoRef.current?.duration || 0;
        setDuration(videoDuration);
        setTrimRange([0, videoDuration]);
        setFrameCount(Math.floor(videoDuration * fps));
      };
    }
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl, fps]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      setCurrentFrame(Math.floor(time * fps));
      updateFramePreview();
    }
  };

  const updateFramePreview = () => {
    if (videoRef.current && frameCanvasRef.current) {
      const ctx = frameCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, frameCanvasRef.current.width, frameCanvasRef.current.height);
      }
    }
  };

  const handleTrimRangeChange = (values: number[]) => {
    setTrimRange([values[0], values[1]]);
    if (videoRef.current) {
      videoRef.current.currentTime = values[0];
    }
  };

  const handleResolutionChange = (value: string) => {
    const resolution = resolutions.find(r => r.label === value) || resolutions[0];
    setSelectedResolution(resolution);
  };

  const seekToFrame = (frameNumber: number) => {
    if (videoRef.current) {
      const time = frameNumber / fps;
      if (time >= 0 && time <= duration) {
        videoRef.current.currentTime = time;
        setCurrentFrame(frameNumber);
      }
    }
  };

  const nextFrame = () => {
    seekToFrame(currentFrame + 1);
  };

  const previousFrame = () => {
    seekToFrame(currentFrame - 1);
  };

  const seekForward = () => {
    seekToFrame(currentFrame + 10);
  };

  const seekBackward = () => {
    seekToFrame(currentFrame - 10);
  };

  const handleSetTrimStart = () => {
    setTrimRange([currentTime, trimRange[1]]);
  };

  const handleSetTrimEnd = () => {
    setTrimRange([trimRange[0], currentTime]);
  };

  useEffect(() => {
    let animationFrame: number;
    const updatePlayback = () => {
      if (videoRef.current && isPlaying) {
        if (currentTime >= trimRange[1]) {
          videoRef.current.currentTime = trimRange[0];
        }
        animationFrame = requestAnimationFrame(updatePlayback);
      }
    };

    if (isPlaying) {
      videoRef.current?.play();
      animationFrame = requestAnimationFrame(updatePlayback);
    } else {
      videoRef.current?.pause();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, currentTime, trimRange]);

  const exportVideo = async () => {
    if (!videoRef.current || !video) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    if (selectedResolution.width === 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    } else {
      canvas.width = selectedResolution.width;
      canvas.height = selectedResolution.height;
    }

    const stream = canvas.captureStream();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm'
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trimmed-video-${selectedResolution.label}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsProcessing(false);
    };

    mediaRecorder.start();

    videoRef.current.currentTime = trimRange[0];
    
    const processFrame = () => {
      if (!videoRef.current) return;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      if (videoRef.current.currentTime < trimRange[1]) {
        videoRef.current.currentTime += 1/fps;
        requestAnimationFrame(processFrame);
      } else {
        mediaRecorder.stop();
      }
    };

    videoRef.current.onseeked = () => {
      processFrame();
      videoRef.current!.onseeked = null;
    };
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
            accept="video/*"
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
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    Frame: {currentFrame}/{frameCount}
                  </div>
                  <div className="text-sm">
                    Time: {formatTime(currentTime)}
                  </div>
                </div>

                <canvas
                  ref={frameCanvasRef}
                  width={320}
                  height={180}
                  className="border border-gray-200 w-full"
                />
                
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="icon" onClick={seekBackward}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={previousFrame}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextFrame}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={seekForward}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={handleSetTrimStart}>
                    Set Start
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSetTrimEnd}>
                    Set End
                  </Button>
                </div>
                <Slider
                  value={[trimRange[0], trimRange[1]]}
                  min={0}
                  max={duration}
                  step={1/fps}
                  onValueChange={handleTrimRangeChange}
                  className="my-4"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(trimRange[0])}</span>
                  <span>{formatTime(trimRange[1])}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Export Resolution</p>
                <Select onValueChange={handleResolutionChange} defaultValue={selectedResolution.label}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutions.map((resolution) => (
                      <SelectItem key={resolution.label} value={resolution.label}>
                        {resolution.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
