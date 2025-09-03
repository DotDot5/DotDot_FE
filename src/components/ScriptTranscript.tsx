// components/ScriptTranscript.tsx
'use client';

import { useState, useEffect } from 'react';

interface SpeechLogDto {
  speakerIndex: number;
  text: string;
  startTime: number;
  endTime: number;
}

interface ScriptTranscriptProps {
  speechLogs: SpeechLogDto[];
  currentTime?: number;
  onScriptClick?: (time: number) => void;
}

export default function ScriptTranscript({
  speechLogs,
  currentTime = 0,
  onScriptClick,
}: ScriptTranscriptProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // 현재 재생 시간에 맞는 스크립트 하이라이트
  useEffect(() => {
    const currentIndex = speechLogs.findIndex(
      (log) => currentTime >= log.startTime && currentTime <= log.endTime
    );
    setHighlightedIndex(currentIndex >= 0 ? currentIndex : null);
  }, [currentTime, speechLogs]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speakerIndex: number): string => {
    const colors = [
      'text-purple-700 bg-purple-50',
      'text-blue-700 bg-blue-50',
      'text-green-700 bg-green-50',
      'text-orange-700 bg-orange-50',
      'text-red-700 bg-red-50',
    ];
    return colors[speakerIndex % colors.length] || 'text-gray-700 bg-gray-50';
  };

  const handleScriptClick = (startTime: number) => {
    onScriptClick?.(startTime);
  };

  if (!speechLogs || speechLogs.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <p className="text-gray-500 text-center">음성 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {speechLogs.map((log, index) => {
        const isHighlighted = highlightedIndex === index;
        const isClickable = !!onScriptClick;

        return (
          <div
            key={index}
            className={`
              p-3 rounded-lg border transition-all duration-200
              ${
                isHighlighted
                  ? 'bg-yellow-100 border-yellow-300 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
              ${isClickable ? 'cursor-pointer hover:shadow-sm' : ''}
            `}
            onClick={() => isClickable && handleScriptClick(log.startTime)}
          >
            <div className="flex items-start space-x-3">
              {/* 화자 정보 */}
              <div
                className={`
                px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                ${getSpeakerColor(log.speakerIndex)}
              `}
              >
                사용자 {log.speakerIndex}
              </div>

              {/* 시간 정보 */}
              <div className="text-xs text-gray-400 whitespace-nowrap mt-1">
                {formatTime(log.startTime)} - {formatTime(log.endTime)}
              </div>
            </div>

            {/* 발언 내용 */}
            <div
              className={`
              mt-2 text-sm leading-relaxed
              ${isHighlighted ? 'text-gray-900 font-medium' : 'text-gray-800'}
            `}
            >
              {log.text}
            </div>

            {/* 클릭 힌트 */}
            {isClickable && (
              <div className="mt-2 text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
                클릭하여 해당 시점으로 이동
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
