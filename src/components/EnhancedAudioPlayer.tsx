'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/internal/ui/button';

interface SpeechLogDto {
  speakerIndex: number;
  text: string;
  startTime: number;
  endTime: number;
}

interface EnhancedAudioPlayerProps {
  audioUrl: string;
  speechLogs?: SpeechLogDto[];
  title?: string;
  onTimeUpdate?: (currentTime: number) => void;
  initialDuration?: number; // DB에서 받아올 오디오 길이 prop
}

// 부모 컴포넌트에서 호출할 수 있는 함수 타입을 정의
export interface AudioPlayerHandle {
  seekToTime: (time: number) => void;
}

const EnhancedAudioPlayer = forwardRef<AudioPlayerHandle, EnhancedAudioPlayerProps>(
  ({ audioUrl, speechLogs = [], title = '회의 오디오', onTimeUpdate, initialDuration }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    // DB에서 받은 initialDuration을 초기값으로 사용
    const [duration, setDuration] = useState(initialDuration || 0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      // DB에서 duration 값을 받았다면, 그 값을 바로 설정
      if (initialDuration) {
        setDuration(initialDuration);
        setIsLoading(false);
      }

      const handleMetadata = () => {
        // initialDuration이 없을 때만 파일 분석을 통해 duration 설정
        if (!initialDuration && audio && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
        onTimeUpdate?.(audio.currentTime);
      };
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const handleError = () => {
        setError('오디오 재생 중 오류가 발생했습니다.');
        setIsLoading(false);
      };
      const handleCanPlay = () => {
        setIsLoading(false);
        handleMetadata();
      };

      if (audio.readyState > 0) {
        handleMetadata();
      }

      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('durationchange', handleMetadata);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleMetadata);
        audio.removeEventListener('durationchange', handleMetadata);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }, [audioUrl, onTimeUpdate, initialDuration]);

    const seekToTime = (time: number) => {
      const audio = audioRef.current;
      if (audio && isFinite(duration)) {
        audio.currentTime = Math.max(0, Math.min(duration, time));
        setCurrentTime(audio.currentTime);
      }
    };

    // 부모가 ref를 통해 seekToTime을 호출할 수 있도록 노출
    useImperativeHandle(ref, () => ({
      seekToTime,
    }));

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => setError('오디오 재생에 실패했습니다.'));
      }
      setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) =>
      seekToTime(parseFloat(e.target.value));

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      if (audioRef.current) audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
      if (!audioRef.current) return;
      const newMuted = !isMuted;
      audioRef.current.volume = newMuted ? 0 : volume;
      setIsMuted(newMuted);
    };

    const skipTime = (seconds: number) => seekToTime(currentTime + seconds);

    const formatTime = (time: number): string => {
      if (isNaN(time) || !isFinite(time)) return '00:00';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {isLoading && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">오디오 로딩 중...</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <div className="text-red-500">⚠️</div>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            </div>
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #FFD93D 0%, #FFD93D ${
                    (currentTime / (duration || 1)) * 100
                  }%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => skipTime(-10)} className="p-2">
                  <RotateCcw size={16} />
                </Button>
                <Button
                  onClick={togglePlay}
                  className="bg-[#FFD93D] hover:bg-[#ffcf0a] text-white p-2"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => skipTime(10)} className="p-2">
                  <RotateCw size={16} />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleMute} className="p-1">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

EnhancedAudioPlayer.displayName = 'EnhancedAudioPlayer';
export default EnhancedAudioPlayer;
