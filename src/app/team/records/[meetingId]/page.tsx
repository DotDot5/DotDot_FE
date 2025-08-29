'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation'; // useRouter 대신 useParams 사용
import { getMeetingDetail, getMeetingSttResult, MeetingSttResultResponse } from '@/api/meeting'; // getMeetingSttResult와 MeetingSttResultResponse 임포트
import SummarySection from '@/components/SummarySection';
import { useMeetingSummary, useMeetingRecommendations } from '@/hooks/useMeeting';
import RecommandSection from '@/components/RecommandSection';

// MeetingDetailResponse 인터페이스가 정의되어 있지 않다면 추가
// 예시:
interface AgendaItem {
  agenda: string;
  body: string;
}

interface Participant {
  id: number;
  name: string;
  // ... 기타 참가자 정보
}

interface MeetingDetailResponse {
  title: string;
  meetingAt: string;
  participants: Participant[];
  agendas: AgendaItem[];
  note: string;
  meetingMethod: 'RECORD' | 'REALTIME';
  teamId: number;
  // ... 기타 회의 상세 정보
}

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = Number(params.meetingId);
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetailResponse | null>(null);
  const [sttResult, setSttResult] = useState<MeetingSttResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: summary, isLoading: loadingSummary } = useMeetingSummary(meetingId);
  const { data: recs, isLoading: loadingRecs } = useMeetingRecommendations(meetingId);

  const recList = useMemo(() => {
    if (Array.isArray(recs)) return recs;
    if (recs && Array.isArray((recs as any).data)) return (recs as any).data;
    if (recs && !Array.isArray(recs)) return [recs as any]; // 요소 1개만 객체로 오는 경우
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
    const fetchData = async () => {
      if (!meetingId) return;

      setLoading(true);
      setError(null);

      try {
        const detail = await getMeetingDetail(meetingId);
        setMeetingDetail(detail);

        const stt = await getMeetingSttResult(meetingId);
        setSttResult(stt);
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

  // 날짜 포맷팅 함수 (필요하다면 util 파일로 분리)
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
  const parseSttTranscript = (transcript: string) => {
    const trimmedTranscript = transcript.trim();
    const lines = trimmedTranscript.split(/\r?\n|\r/);
    const parsedData = lines
      .map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
          return null;
        }

        const match = trimmedLine.match(/^\[(.*?)\]\s+\((.*?)\)\s+(.*)/);
        if (match) {
          const [_, speaker, time, text] = match;
          return { speaker, time, text };
        }
        return null;
      })
      .filter((item) => item !== null);

    return parsedData;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* 회의 정보 및 음성 기록 */}
      <div className="w-2/3 p-6 overflow-y-auto bg-white border-r border-gray-200">
        <div className="space-y-6">
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

          {/*STT 결과 표시 영역 */}
          <section>
            <h2 className="text-2xl font-bold mb-2">음성 기록</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 min-h-[200px]">
              {sttResult && sttResult.transcript ? (
                <div className="space-y-4">
                  {parseSttTranscript(sttResult.transcript).map((item, index) => {
                    const cleanedText = item.text;

                    return (
                      <div key={index} className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-purple-700">{item.speaker}</p>
                        <p className="text-sm text-gray-800">{cleanedText}</p>
                        <p className="text-xs text-gray-400">{item.time}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">STT 기록이 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 요약 및 자료 */}
      <div className="w-1/3 p-6 overflow-y-auto bg-[#f7f7f7]">
        <div className="space-y-6">
          <SummarySection summary={summaryText} loading={loadingSummary} />
          <RecommandSection items={recList} loading={loadingRecs} />
        </div>
      </div>
    </div>
  );
}
