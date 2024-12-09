import { useEffect } from 'react';

// Components
import { Slider } from '~/components/ui/slider';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import Loader from '~/components/Loader/Loader';

// Icons
import { Play, Pause } from 'lucide-react';

// Hooks
import { useFfmpeg } from '~/hooks/useFfmpeg';

const FPS = 30;

interface CutterViewProps { 
  videoUrl: string;
  duration: number;
  trimRange: [number, number];
  isPlaying: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTimeUpdate: () => void;
  togglePlayPause: () => void;
  handleTrimRangeChange: (value: [number, number]) => void;
  exportVideo: () => void;
  estimatedSize: string;
  isProcessing: boolean;
  formatTime: (seconds: number) => string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

function CutterView({
  videoUrl, duration, trimRange, isPlaying, handleFileChange, handleTimeUpdate,
  togglePlayPause, handleTrimRangeChange, exportVideo, estimatedSize, isProcessing,
  formatTime, videoRef
}: CutterViewProps) {
  const { isLoading } = useFfmpeg();

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = trimRange[0];
  }, [trimRange]);

  if (isLoading) return <Loader />;

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
}

export default CutterView;
