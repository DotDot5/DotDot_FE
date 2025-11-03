'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getMeetingDetail,
  getMeetingSttResult,
  MeetingSttResultResponse,
  deleteMeeting,
  updateMeetingDetail,
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
import EnhancedAudioPlayer, { AudioPlayerHandle } from '@/components/EnhancedAudioPlayer';
import ScriptTranscript from '@/components/ScriptTranscript';
import { useMeetingSummary, useMeetingRecommendations } from '@/hooks/useMeeting';
import { useBookmark } from '@/hooks/useBookmark';
import RecommandSection from '@/components/RecommandSection';
import { useActiveTeam } from '@/context/activeTeamContext';
import { formatKoreanDate } from '@/utils/fotmatDate';

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
  // meetingMethod: 'RECORD' | 'REALTIME';
  meetingMethod: 'RECORD' | 'REALTIME' | 'NONE';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const { handleToggleBookmark, isBookmarked } = useBookmark(meetingId);

  const audioPlayerRef = useRef<AudioPlayerHandle>(null);

  const isNone = meetingDetail?.meetingMethod === 'NONE';

  const [isEditing, setIsEditing] = useState(false);
  const [editableAgendas, setEditableAgendas] = useState<AgendaItem[]>([]);
  const [editableNote, setEditableNote] = useState('');
  const { setActiveTeamId } = useActiveTeam();

  useEffect(() => {
    if (meetingDetail?.teamId) {
      setActiveTeamId(meetingDetail.teamId);
    }
    return () => {
      setActiveTeamId(null);
    };
  }, [meetingDetail, setActiveTeamId]);

  // const { data: summary, isLoading: loadingSummary } = useMeetingSummary(meetingId);
  // const { data: recs, isLoading: loadingRecs } = useMeetingRecommendations(meetingId);
  const { data: summary, isLoading: loadingSummary } = useMeetingSummary(
    meetingDetail?.meetingMethod === 'NONE' ? undefined : meetingId
  );

  const { data: recs, isLoading: loadingRecs } = useMeetingRecommendations(
    meetingDetail?.meetingMethod === 'NONE' ? undefined : meetingId
  );

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
    if (isNaN(meetingId)) {
      setLoading(false);
      setError('잘못된 회의 ID입니다.');
      return;
    }

    // const normalizeMethod = (m: string): 'RECORD' | 'REALTIME' =>
    //   m === 'REALTIME' ? 'REALTIME' : 'RECORD';
    const normalizeMethod = (m?: string | null): 'RECORD' | 'REALTIME' | 'NONE' => {
      if (m === 'REALTIME') return 'REALTIME';
      if (m === 'RECORD') return 'RECORD';
      return 'NONE'; // 그 외(미설정 포함)는 NONE 처리
    };

    const fetchData = async () => {
      if (!meetingId) return;
      setLoading(true);
      setError(null);
      try {
        const detailAny = await getMeetingDetail(meetingId);

        const raw: any =
          detailAny && typeof detailAny === 'object' && 'data' in detailAny
            ? (detailAny as any).data
            : detailAny;

        if (!raw) {
          throw new Error('Invalid meeting detail response');
        }

        // const normalizeMethod = (m: string | undefined | null): 'RECORD' | 'REALTIME' =>
        //   m === 'REALTIME' ? 'REALTIME' : 'RECORD';
        const normalizeMethod = (m?: string | null): 'RECORD' | 'REALTIME' | 'NONE' => {
          if (m === 'REALTIME') return 'REALTIME';
          if (m === 'RECORD') return 'RECORD';
          return 'NONE'; // 그 외(미설정 포함)는 NONE 처리
        };

        const stt = await getMeetingSttResult(meetingId);
        setSttResult(stt);

        if (stt?.audioId) {
          if (stt.audioId.startsWith('gs://')) {
            try {
              const encodedAudioId = encodeURIComponent(stt.audioId);
              const apiUrl = `/api/audio?audioId=${encodedAudioId}`;

              const audioResponse = await fetch(apiUrl);

              if (audioResponse.ok) {
                const audioData = await audioResponse.json();
                setAudioUrl(audioData.audioUrl);
              } else {
                const errorData = await audioResponse.json();
                setAudioUrl(null);
              }
            } catch (audioError) {
              console.error('오디오 API 호출 실패:', audioError);
              console.warn('오디오 플레이어 비활성화');
              setAudioUrl(null); // 에러 시 오디오 비활성화
            }
          } else if (stt.audioId.startsWith('https://')) {
            setAudioUrl(stt.audioId);
          } else {
            setAudioUrl(stt.audioId);
          }
        } else {
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
        setMeetingDetail(mapped);
        // 편집 상태 초기화
        setEditableAgendas(mapped.agendas);
        setEditableNote(mapped.note || '');
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
  // ====== 안건/메모 편집 로직 ======
  const startEdit = () => {
    if (!meetingDetail) return;
    setEditableAgendas(meetingDetail.agendas);
    setEditableNote(meetingDetail.note || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (!meetingDetail) return;
    setEditableAgendas(meetingDetail.agendas);
    setEditableNote(meetingDetail.note || '');
    setIsEditing(false);
  };
  const handleAgendaChange = (idx: number, field: 'agenda' | 'body', value: string) => {
    setEditableAgendas((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addAgenda = () => {
    setEditableAgendas((prev) => [...prev, { agenda: '', body: '' }]);
  };

  const removeAgenda = (idx: number) => {
    setEditableAgendas((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveChanges = async () => {
    if (!meetingDetail) return;
    try {
      setSaving(true);

      // 서버가 전체 payload를 기대할 가능성이 높아 기존 값 보존 + 변경 필드만 교체
      const payload = {
        teamId: meetingDetail.teamId,
        title: meetingDetail.title,
        meetingAt: meetingDetail.meetingAt,
        meetingMethod: meetingDetail.meetingMethod, // NONE 포함
        note: editableNote ?? '',
        participants: (meetingDetail.participants ?? []).map((p, idx) => ({
          userId: p.id,
          part: p.part ?? 'member',
          speakerIndex: typeof p.speakerIndex === 'number' ? p.speakerIndex : idx,
          userName: p.name ?? '',
        })),
        agendas: (editableAgendas ?? []).map((a) => ({
          agenda: a.agenda ?? '',
          body: a.body ?? '',
        })),
      };

      await updateMeetingDetail(meetingDetail.meetingId, payload as any);

      // 로컬 상태 반영
      setMeetingDetail((prev) =>
        prev
          ? {
              ...prev,
              agendas: editableAgendas,
              note: editableNote,
            }
          : prev
      );
      setIsEditing(false);
      toast.success('회의 안건/메모가 저장되었습니다.');
    } catch (e) {
      console.error(e);
      toast.error('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 북마크 토글 핸들러
  const handleBookmarkToggle = async (speechLogId: number) => {
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* 왼쪽 영역: 회의 정보 및 음성 기록 */}
      <div className="w-2/3 flex flex-col overflow-hidden bg-white border-r border-gray-200">
        {/* 오디오 플레이어 */}
        {/* {audioUrl && sttResult?.speechLogs && meetingDetail && (
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
        )} */}
        {!isNone && audioUrl && sttResult?.speechLogs && meetingDetail && (
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
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button
                      size="sm"
                      className="bg-[#FFD93D] hover:bg-yellow-400 text-white"
                      onClick={startEdit}
                    >
                      편집하기
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#3B82F6] hover:bg-[#3174E6] text-white"
                        onClick={saveChanges}
                        disabled={saving}
                      >
                        {saving ? '저장 중...' : '저장'}
                      </Button>
                    </>
                  )}

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
                {!isEditing ? (
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
                ) : (
                  <div className="space-y-4">
                    {editableAgendas.map((ag, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 border-2 border-[#666666] bg-[#666666] rounded-full"></div>
                          <input
                            type="text"
                            value={ag.agenda}
                            onChange={(e) => handleAgendaChange(idx, 'agenda', e.target.value)}
                            placeholder="안건 제목"
                            className="w-full text-sm font-medium bg-transparent outline-none"
                          />
                          <button
                            onClick={() => removeAgenda(idx)}
                            className="text-xs text-[#666666] hover:text-red-500"
                            title="안건 삭제"
                          >
                            ✕
                          </button>
                        </div>
                        <textarea
                          value={ag.body}
                          onChange={(e) => handleAgendaChange(idx, 'body', e.target.value)}
                          placeholder="안건에 대한 메모를 작성하세요"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#666666] bg-gray-50 resize-none"
                          rows={3}
                        />
                      </div>
                    ))}
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300"
                        onClick={addAgenda}
                        disabled={saving}
                      >
                        안건 추가
                      </Button>
                    </div>
                  </div>
                )}
                <div className="bg-[#FFD93D] text-white px-3 py-1 inline-block rounded text-sm font-semibold">
                  회의 메모
                </div>
                {!isEditing ? (
                  <p className="text-gray-700">{meetingDetail.note || '메모가 없습니다.'}</p>
                ) : (
                  <textarea
                    value={editableNote}
                    onChange={(e) => setEditableNote(e.target.value)}
                    placeholder="회의에 대한 내용을 자유롭게 메모하세요"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#333] bg-white min-h-[140px]"
                  />
                )}{' '}
              </div>
            </section>
            {/* STT 결과 표시 영역 (녹음 없음이면 숨김) */}{' '}
            {!isNone && (
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
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽 영역: 요약 및 자료 */}
      <div className="w-1/3 p-6 overflow-y-auto bg-[#f7f7f7]">
        <div className="space-y-6">
          {isNone ? (
            <>
              <div className="bg-white p-4 rounded-lg border text-sm text-gray-600">
                녹음 없이 진행된 회의입니다. <b>자동 요약</b>은 생성되지 않습니다.
              </div>
              <div className="bg-white p-4 rounded-lg border text-sm text-gray-600">
                녹음 없이 진행된 회의입니다. <b>추천 자료</b>는 생성되지 않습니다.
              </div>
            </>
          ) : (
            <>
              <SummarySection summary={summaryText} loading={loadingSummary} />
              <RecommandSection items={recList} loading={loadingRecs} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
