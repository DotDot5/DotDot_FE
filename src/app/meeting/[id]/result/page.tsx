'use client';

import { useState, useEffect } from 'react';
import SummarySection from '@/components/SummarySection';
import RecommandSection from '@/components/RecommandSection';
import { Button } from '@/components/internal/ui/button';
import { Avatar, AvatarFallback } from '@/components/internal/ui/avatar';
import TodoItem from '@/components/internal/TodoItem';
import { ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

interface SttApiResponse {
  transcript: string;
  duration: number;
  segments?: { speaker: number; text: string; startTime: string; endTime: string }[];
}

const formatKoreanDate = (isoString: string | null): string => {
  if (!isoString) return '날짜 정보 없음';
  try {
    const date = new Date(isoString);
    const day = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    const time = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${day} ${time}`;
  } catch (e) {
    console.error('날짜 형식 지정 오류:', e);
    return '날짜 형식 오류';
  }
};

export default function MeetingResultPage() {
  const [showTodos, setShowTodos] = useState(true);
  const [openEmailIndex, setOpenEmailIndex] = useState<number | null>(null);
  const [sttData, setSttData] = useState<SttApiResponse | null>(null);
  const [isLoadingStt, setIsLoadingStt] = useState<boolean>(true);
  const [errorStt, setErrorStt] = useState<string | null>(null);

  const params = useParams();
  const searchParams = useSearchParams();

  const sttResultId = searchParams.get('sttResultId');
  const meetingTitle = searchParams.get('meetingTitle');
  const meetingDateISO = searchParams.get('meetingDateISO');
  const participantCount = searchParams.get('participantCount');

  useEffect(() => {
    if (sttResultId) {
      const fetchSttResult = async () => {
        setIsLoadingStt(true);
        setErrorStt(null);
        try {
          const response = await fetch(`/api/transcribe?sttResultId=${sttResultId}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'STT 결과를 불러오지 못했습니다.');
          }

          const responseData = await response.json();
          setSttData(responseData.data as SttApiResponse);
        } catch (err) {
          console.error('STT 결과 로딩 중 오류 발생:', err);
          setErrorStt(`STT 결과를 불러오지 못했습니다: ${(err as Error).message}`);
          setSttData(null);
        } finally {
          setIsLoadingStt(false);
        }
      };
      fetchSttResult();
    } else {
      setIsLoadingStt(true);
      setErrorStt('STT 결과 ID가 제공되지 않았습니다.');
    }
  }, [sttResultId]);

  const handleToggleEmail = (index: number) => {
    setOpenEmailIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-2/3 overflow-y-auto p-6">
        <h1 className="text-xl font-bold mb-5">
          {meetingTitle ? decodeURIComponent(meetingTitle) : '회의 제목 불러오는 중...'}
        </h1>
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              {formatKoreanDate(meetingDateISO ? decodeURIComponent(meetingDateISO) : null)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>
              {participantCount ? `${participantCount}명 참석` : '참석자 수 불러오는 중...'}
            </span>
          </div>
        </div>

        {isLoadingStt ? (
          <p className="p-4 bg-white border rounded-md">STT 결과를 불러오는 중입니다...</p>
        ) : errorStt ? (
          <p className="p-4 bg-white border rounded-md text-red-600">{errorStt}</p>
        ) : (
          <SummarySection text={sttData?.transcript || 'STT 결과 없음'} />
        )}

        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🧑‍💻 각 담당자별 할 일 보기</h3>
            <button onClick={() => setShowTodos((prev) => !prev)}>
              {showTodos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {showTodos && (
            <div className="space-y-4">
              <TodoItem
                label="메인 페이지 디자인 작업"
                assignee="고예린"
                dueDate="2025.07.04"
                important
              />
              <TodoItem label="백엔드 API 명세 검토" assignee="이승현" dueDate="2025.07.05" />
            </div>
          )}
        </section>

        <RecommandSection />

        <div className="flex justify-center mt-8">
          <Button className="bg-[#FFD93D] text-white text-sm font-medium px-6 py-2 rounded-md">
            저장
          </Button>
        </div>
      </div>

      <div className="w-1/3 border-l overflow-y-auto p-6 bg-white">
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2">📧 이메일 발송</h3>
          <div className="space-y-4">
            {[
              {
                email: 'sehyun@soongsil.ac.kr',
                content: '회의 요약: 프로젝트 일정 및 우선순위 조정 사항...',
              },
              {
                email: 'iammin@soongsil.ac.kr',
                content: '회의 요약: 메인 화면 기획안 및 피드백 반영 내용...',
              },
              {
                email: 'jieun7321@soongsil.ac.kr',
                content: '회의 요약: 백엔드 API 명세서 검토 결과...',
              },
            ].map((item, index) => (
              <div key={index} className="border p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" />
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{item.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-800">{item.email}</p>
                  </div>
                  <button onClick={() => handleToggleEmail(index)}>
                    {openEmailIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {openEmailIndex === index && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="text-sm px-4 py-1">
              수정
            </Button>
            <Button className="text-sm px-4 py-1 bg-[#FFD93D] text-white">이메일 전송</Button>
          </div>

          <div className="flex justify-center mt-8">
            <Button className="bg-primary text-white text-sm font-medium px-6 py-2 rounded-md">
              회의 내용 PDF 다운로드
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
