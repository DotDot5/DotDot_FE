// components/ScriptTranscript.tsx
'use client';

import { useState, useEffect } from 'react';

interface SpeechLogDto {
  speechLogId: number;
  speakerIndex: number;
  text: string;
  startTime: number;
  endTime: number;
}

interface ScriptTranscriptProps {
  speechLogs: SpeechLogDto[];
  currentTime?: number;
  onScriptClick?: (time: number) => void;
  onBookmarkToggle?: (speechLogId: number) => void;
  isBookmarked?: (speechLogId: number) => boolean;
}

export default function ScriptTranscript({
  speechLogs,
  currentTime = 0,
  onScriptClick,
  onBookmarkToggle,
  isBookmarked,
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

  const handleBookmarkClick = (e: React.MouseEvent, speechLogId: number) => {
    e.stopPropagation(); // 스크립트 클릭 이벤트와 분리
    onBookmarkToggle?.(speechLogId);
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
        const speechLogId = log.speechLogId; // speechLogId 직접 사용
        const bookmarked = isBookmarked?.(speechLogId) || false;

        return (
          <div
            key={speechLogId}
            className={`
              relative p-3 rounded-lg border transition-all duration-200
              ${
                bookmarked
                  ? 'bg-yellow-50 border-yellow-200'
                  : isHighlighted
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }
              ${isClickable ? 'cursor-pointer hover:shadow-sm' : ''}
            `}
            onClick={() => isClickable && handleScriptClick(log.startTime)}
          >
            {/* 북마크 버튼 */}
            <button
              className={`
                absolute top-2 right-2 p-1 rounded-md transition-all duration-200 z-10
                ${
                  bookmarked
                    ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }
              `}
              onClick={(e) => handleBookmarkClick(e, speechLogId)}
              title={bookmarked ? '북마크 해제' : '북마크 추가'}
            >
              <svg
                className="w-5 h-5"
                fill={bookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={bookmarked ? 0 : 2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>

            <div className="flex items-start space-x-3 pr-8">
              {/* 화자 정보 */}
              <div
                className={`
                px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                ${getSpeakerColor(log.speakerIndex)}
              `}
              >
                사용자
              </div>

              {/* 시간 정보 */}
              <div className="text-xs text-gray-400 whitespace-nowrap mt-1">
                {formatTime(log.startTime)} - {formatTime(log.endTime)}
              </div>
            </div>

            {/* 발언 내용 */}
            <div
              className={`
              mt-2 text-sm leading-relaxed pr-8
              ${
                bookmarked
                  ? 'text-gray-900 font-medium'
                  : isHighlighted
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-800'
              }
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
