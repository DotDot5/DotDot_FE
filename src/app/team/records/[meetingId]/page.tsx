'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getMeetingDetail, getMeetingSttResult, MeetingSttResultResponse } from '@/api/meeting';
import SummarySection from '@/components/SummarySection';
import ResourcesSection from '@/components/RecommandSection';
import EnhancedAudioPlayer, { AudioPlayerHandle } from '@/components/EnhancedAudioPlayer';
import ScriptTranscript from '@/components/ScriptTranscript';

interface AgendaItem {
  agenda: string;
  body: string;
}

interface Participant {
  id: number;
  name: string;
}

interface MeetingDetailResponse {
  title: string;
  meetingAt: string;
  participants: Participant[];
  agendas: AgendaItem[];
  note: string;
  meetingMethod: 'RECORD' | 'REALTIME';
  teamId: number;
  duration: number; // DB에서 받아올 오디오 길이
}

interface SpeechLogDto {
  speakerIndex: number;
  text: string;
  startTime: number;
  endTime: number;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = Number(params.meetingId);
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetailResponse | null>(null);
  const [sttResult, setSttResult] = useState<MeetingSttResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // EnhancedAudioPlayer의 함수를 호출하기 위한 ref 생성
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);

  useEffect(() => {
    if (isNaN(meetingId)) {
      setLoading(false);
      setError('잘못된 회의 ID입니다.');
      return;
    }

    const fetchData = async () => {
      if (!meetingId) return;
      setLoading(true);
      setError(null);
      try {
        const detail = await getMeetingDetail(meetingId);
        setMeetingDetail(detail);

        const stt = await getMeetingSttResult(meetingId);
        setSttResult(stt);

        if (stt.audioId) {
          if (stt.audioId.startsWith('gs://') || stt.audioId.startsWith('https://')) {
            try {
              const audioResponse = await fetch(
                `/api/audio?audioId=${encodeURIComponent(stt.audioId)}`
              );
              if (audioResponse.ok) {
                const audioData = await audioResponse.json();
                setAudioUrl(audioData.audioUrl);
              } else {
                setAudioUrl(stt.audioId);
              }
            } catch (audioError) {
              console.warn('오디오 URL 처리 실패, 직접 사용:', audioError);
              setAudioUrl(stt.audioId);
            }
          } else {
            setAudioUrl(stt.audioId);
          }
        }
      } catch (err: any) {
        console.error('데이터 불러오기 실패:', err);
        setError('회의 정보를 불러오는 데 실패했습니다.');
        if (err?.response?.status === 404) {
          setError('해당 회의를 찾을 수 없습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meetingId]);

  const handleAudioTimeUpdate = (time: number) => {
    setCurrentAudioTime(time);
  };

  // ref를 통해 플레이어의 seekToTime 함수를 직접 호출
  const handleScriptClick = (time: number) => {
    audioPlayerRef.current?.seekToTime(time);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-lg text-gray-600">
        회의 정보를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-lg text-red-600">
        오류: {error}
      </div>
    );
  }

  if (!meetingDetail) {
    return (
      <div className="flex justify-center items-center h-full text-lg text-gray-600">
        회의 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const formatKoreanDate = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek}) ${hours}:${minutes}`;
  };
  console.log('EnhancedAudioPlayer에 전달될 데이터 확인:', meetingDetail);
  return (
    <div className="flex h-full overflow-hidden">
      {/* 왼쪽 영역: 회의 정보 및 음성 기록 */}
      <div className="w-2/3 flex flex-col overflow-hidden bg-white border-r border-gray-200">
        {/* 오디오 플레이어 */}
        {audioUrl && sttResult?.speechLogs && meetingDetail && (
          <div className="flex-shrink-0 p-4 border-b border-gray-200">
            <EnhancedAudioPlayer
              ref={audioPlayerRef}
              audioUrl={audioUrl}
              speechLogs={sttResult.speechLogs}
              title={`${meetingDetail.title} 녹음`}
              onTimeUpdate={handleAudioTimeUpdate}
              initialDuration={meetingDetail.duration} // DB에서 가져온 duration 값을 전달
            />
          </div>
        )}

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 회의 기본 정보 */}
            <section>
              <h2 className="text-2xl font-bold mb-2">{meetingDetail.title}</h2>
              <p className="text-gray-500">{formatKoreanDate(meetingDetail.meetingAt)}</p>

              <div className="mt-4 space-y-3">
                <div className="bg-[#FFD93D] text-white px-3 py-1 inline-block rounded text-sm font-semibold">
                  회의 멤버
                </div>
                <p className="text-gray-700">
                  {meetingDetail.participants.map((p) => p.name).join(', ')}
                </p>

                <div className="bg-[#FFD93D] text-white px-3 py-1 inline-block rounded text-sm font-semibold">
                  회의 안건
                </div>
                <ul className="list-disc list-inside text-gray-800 space-y-6">
                  {meetingDetail.agendas.map((agenda, index) => (
                    <li key={index}>
                      <span className="font-semibold">{agenda.agenda}</span>
                      <div className="mt-2 ml-4 p-4 rounded-md border border-gray-200 bg-white shadow-sm text-sm leading-relaxed">
                        {agenda.body}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="bg-[#FFD93D] text-white px-3 py-1 inline-block rounded text-sm font-semibold">
                  회의 메모
                </div>
                <p className="text-gray-700">{meetingDetail.note || '메모가 없습니다.'}</p>
              </div>
            </section>

            {/* STT 결과 표시 영역 */}
            <section>
              <h2 className="text-2xl font-bold mb-4">음성 기록</h2>
              {sttResult && sttResult.speechLogs && sttResult.speechLogs.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="mb-3 text-sm text-gray-600">
                    💡 발언 내용을 클릭하면 해당 시점으로 오디오가 이동합니다.
                  </div>
                  <ScriptTranscript
                    speechLogs={sttResult.speechLogs}
                    currentTime={currentAudioTime}
                    onScriptClick={audioUrl ? handleScriptClick : undefined}
                  />
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 min-h-[200px]">
                  <p className="text-gray-500">음성 기록이 없습니다.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* 오른쪽 영역: 요약 및 자료 */}
      <div className="w-1/3 p-6 overflow-y-auto bg-[#f7f7f7]">
        <div className="space-y-6">
          <SummarySection />
          <ResourcesSection />
        </div>
      </div>
    </div>
  );
}
