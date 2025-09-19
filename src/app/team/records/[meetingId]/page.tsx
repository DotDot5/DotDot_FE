'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getMeetingDetail,
  getMeetingSttResult,
  MeetingSttResultResponse,
  deleteMeeting,
} from '@/api/meeting';
import SummarySection from '@/components/SummarySection';
import { Button } from '@/components/internal/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from '@/components/internal/ui/popover';
import { toast } from 'sonner';
import ConfirmModal from '@/app/calendar/[id]/ConfirmModal';
import EnhancedAudioPlayer, { AudioPlayerHandle } from '@/components/EnhancedAudioPlayer';
import ScriptTranscript from '@/components/ScriptTranscript';
import { useMeetingSummary, useMeetingRecommendations } from '@/hooks/useMeeting';
import { useBookmark } from '@/hooks/useBookmark';
import RecommandSection from '@/components/RecommandSection';

interface AgendaItem {
  agenda: string;
  body: string;
}

// 화면에서 쓸 표준 모델
interface Participant {
  id: number;
  name: string;
  part?: string;
  speakerIndex?: number;
}

interface MeetingDetailResponse {
  meetingId: number;
  title: string;
  meetingAt: string;
  participants: Participant[];
  agendas: AgendaItem[];
  note: string;
  meetingMethod: 'RECORD' | 'REALTIME';
  teamId: number;
  duration?: number;
}

type ParticipantApi = {
  userId: number;
  userName: string;
  part: string;
  speakerIndex: number;
};

type AgendaApi = { agenda: string; body: string };

type MeetingDetailApiData = {
  meetingId: number;
  teamId: number;
  title: string;
  meetingAt: string;
  meetingMethod: string;
  note: string;
  participants: ParticipantApi[];
  agendas: AgendaApi[];
};

type MeetingDetailApiResponse = {
  status: string;
  timestamp: string;
  data: MeetingDetailApiData;
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = Number(params.meetingId);
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetailResponse | null>(null);
  const [sttResult, setSttResult] = useState<MeetingSttResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const { handleToggleBookmark, isBookmarked } = useBookmark(meetingId);

  const audioPlayerRef = useRef<AudioPlayerHandle>(null);

  const { data: summary, isLoading: loadingSummary } = useMeetingSummary(meetingId);
  const { data: recs, isLoading: loadingRecs } = useMeetingRecommendations(meetingId);

  const recList = useMemo(() => {
    if (Array.isArray(recs)) return recs;
    if (recs && Array.isArray((recs as any).data)) return (recs as any).data;
    if (recs && !Array.isArray(recs)) return [recs as any];
    return [];
  }, [recs]);

  const summaryText = useMemo(() => {
    return (summary as any)?.summary ?? (summary as any)?.data?.summary ?? '';
  }, [summary]);

  useEffect(() => {
    console.log('=== 환경변수 확인 ===');
    console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('현재 도메인:', window.location.origin);
    if (isNaN(meetingId)) {
      setLoading(false);
      setError('잘못된 회의 ID입니다.');
      return;
    }

    const normalizeMethod = (m: string): 'RECORD' | 'REALTIME' =>
      m === 'REALTIME' ? 'REALTIME' : 'RECORD';

    const fetchData = async () => {
      if (!meetingId) return;
      setLoading(true);
      setError(null);

      console.log('=== fetchData 시작 ===');
      console.log('meetingId:', meetingId);

      try {
        const detailAny = await getMeetingDetail(meetingId);

        const raw: any =
          detailAny && typeof detailAny === 'object' && 'data' in detailAny
            ? (detailAny as any).data
            : detailAny;

        if (!raw) {
          throw new Error('Invalid meeting detail response');
        }

        const normalizeMethod = (m: string | undefined | null): 'RECORD' | 'REALTIME' =>
          m === 'REALTIME' ? 'REALTIME' : 'RECORD';

        console.log('=== STT 결과 조회 시작 ===');
        const stt = await getMeetingSttResult(meetingId);
        console.log('배포환경 STT 결과 전체:', stt);
        console.log('배포환경 speechLogs 첫 번째 항목:', stt?.speechLogs?.[0]);
        console.log('배포환경 speechLogs 개수:', stt?.speechLogs?.length);
        setSttResult(stt);

        if (stt?.audioId) {
          console.log('=== 오디오 처리 시작 ===');
          console.log('원본 audioId:', stt.audioId);
          console.log('audioId 타입:', typeof stt.audioId);

          if (stt.audioId.startsWith('gs://')) {
            console.log('GCS URL 감지, 서명된 URL 생성 시도...');
            try {
              const encodedAudioId = encodeURIComponent(stt.audioId);
              const apiUrl = `/api/audio?audioId=${encodedAudioId}`;
              console.log('API 호출 URL:', apiUrl);

              const audioResponse = await fetch(apiUrl);
              console.log('오디오 API 응답 상태:', audioResponse.status);

              if (audioResponse.ok) {
                const audioData = await audioResponse.json();
                console.log('서명된 URL 생성 성공:', audioData.audioUrl);
                setAudioUrl(audioData.audioUrl);
              } else {
                const errorText = await audioResponse.text();
                console.error('서명된 URL 생성 실패:', errorText);
                console.warn('오디오 플레이어 비활성화');
                setAudioUrl(null); // GCS URL을 직접 사용하지 않음
              }
            } catch (audioError) {
              console.error('오디오 API 호출 실패:', audioError);
              console.warn('오디오 플레이어 비활성화');
              setAudioUrl(null); // 에러 시 오디오 비활성화
            }
          } else if (stt.audioId.startsWith('https://')) {
            console.log('HTTPS URL 직접 사용:', stt.audioId);
            setAudioUrl(stt.audioId);
          } else {
            console.log('일반 파일 경로, 직접 사용:', stt.audioId);
            setAudioUrl(stt.audioId);
          }
          console.log('=== 오디오 처리 완료 ===');
        } else {
          console.log('audioId가 없음, 오디오 플레이어 비활성화');
          setAudioUrl(null);
        }

        const mapped: MeetingDetailResponse = {
          meetingId: raw.meetingId,
          title: raw.title,
          meetingAt: raw.meetingAt,
          meetingMethod: normalizeMethod(raw.meetingMethod),
          note: raw.note ?? '',
          teamId: raw.teamId,
          agendas: Array.isArray(raw.agendas)
            ? raw.agendas.map((a: any) => ({ agenda: a.agenda, body: a.body }))
            : [],
          participants: Array.isArray(raw.participants)
            ? raw.participants.map((p: any) => ({
                id: p.userId ?? p.id,
                name: p.userName ?? p.name ?? '',
                part: p.part,
                speakerIndex: p.speakerIndex,
              }))
            : [],
          duration: raw.duration,
        };

        console.log('=== 최종 매핑된 데이터 ===');
        console.log('mapped meetingDetail:', mapped);
        setMeetingDetail(mapped);
      } catch (err: any) {
        console.error('데이터 불러오기 실패:', err);
        setError('회의 정보를 불러오는 데 실패했습니다.');
        if (err?.response?.status === 404) {
          setError('해당 회의를 찾을 수 없습니다.');
        }
      } finally {
        setLoading(false);
        console.log('=== fetchData 완료 ===');
      }
    };

    fetchData();
  }, [meetingId]);

  const handleAudioTimeUpdate = (time: number) => {
    setCurrentAudioTime(time);
  };

  const handleScriptClick = (time: number) => {
    audioPlayerRef.current?.seekToTime(time);
  };

  // 회의 삭제 핸들러 추가
  const handleDeleteMeeting = async () => {
    if (!meetingDetail) return;
    try {
      await deleteMeeting(meetingDetail.meetingId);
      toast.success('회의록이 성공적으로 삭제되었습니다.');
      router.push(`/team/${meetingDetail.teamId}`);
    } catch (error) {
      console.error('회의록 삭제 실패:', error);
      toast.error('회의록 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 북마크 토글 핸들러
  const handleBookmarkToggle = async (speechLogId: number) => {
    console.log('북마크 클릭된 speechLogId:', speechLogId);
    console.log('speechLogId 타입:', typeof speechLogId);
    console.log('speechLogId가 undefined인가?:', speechLogId === undefined);

    // speechLogId가 undefined면 early return
    if (!speechLogId || speechLogId === undefined) {
      console.error('speechLogId가 유효하지 않습니다:', speechLogId);
      toast.error('북마크를 추가할 수 없습니다. 잘못된 데이터입니다.');
      return;
    }

    try {
      await handleToggleBookmark(speechLogId);
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    }
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
              initialDuration={meetingDetail.duration}
            />
          </div>
        )}

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 회의 기본 정보 */}
            <section>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold">{meetingDetail.title}</h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                      aria-label="회의록 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">회의록 삭제</h4>
                        <p className="text-sm text-gray-600">
                          정말로 이 회의록을 삭제하시겠습니까?
                          <br />이 작업은 되돌릴 수 없습니다.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <PopoverClose asChild>
                          <Button variant="ghost" size="sm">
                            취소
                          </Button>
                        </PopoverClose>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={handleDeleteMeeting}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                  <div className="mb-3 text-sm text-gray-600 flex items-center space-x-4">
                    {/* <span>💡 발언 내용을 클릭하면 해당 시점으로 오디오가 이동합니다.</span> */}
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-4 h-4 text-yellow-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span>북마크 아이콘을 클릭하여 중요한 내용을 저장하세요.</span>
                    </span>
                  </div>
                  <ScriptTranscript
                    speechLogs={sttResult.speechLogs}
                    currentTime={currentAudioTime}
                    onScriptClick={audioUrl ? handleScriptClick : undefined}
                    onBookmarkToggle={handleBookmarkToggle}
                    isBookmarked={isBookmarked}
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
          <SummarySection summary={summaryText} loading={loadingSummary} />
          <RecommandSection items={recList} loading={loadingRecs} />
        </div>
      </div>
    </div>
  );
}
