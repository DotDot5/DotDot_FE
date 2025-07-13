'use client';

import { Button } from '@/components/internal/ui/button';
import { CalendarIcon, Clock, Video } from 'lucide-react';
import { useState } from 'react';

export default function MeetingInfoPage() {
  const [agendaChecked, setAgendaChecked] = useState([true, true]); // 안건 체크 상태

  const handleAgendaCheck = (index: number) => {
    const updated = [...agendaChecked];
    updated[index] = !updated[index];
    setAgendaChecked(updated);
  };
  return (
    <div className="px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-[#000000]">제품 출시 회의</h1>
        <Button
          variant="outline"
          className="px-6 py-2 text-sm font-medium text-[#000000] border border-gray-300"
        >
          수정하기
        </Button>
      </div>

      {/* 회의 정보 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#000000] mb-4">회의 정보</h2>
        <div className="grid grid-cols-3 gap-4 text-sm text-[#000000]">
          {/* 날짜 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">날짜</span>
            </div>
            <span>2025.07.01</span>
          </div>

          {/* 시간 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">시간</span>
            </div>
            <span>오후 09:10</span>
          </div>

          {/* 기록 방식 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">기록 방식</span>
            </div>
            <span className="font-medium">실시간 녹음</span>
          </div>
        </div>
      </section>

      {/* 참석자 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#000000] mb-4">참석자 (4명)</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: '김다은', role: '프론트' },
            { name: '김세현', role: '프론트' },
            { name: '고예린', role: '참석자' },
            { name: '정태윤', role: '참석자' },
          ].map((member, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-sm text-[#000000] truncate">{member.name}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  member.role === '프론트'
                    ? 'bg-blue-100 text-blue-600'
                    : member.role === '백엔드'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 회의 안건 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">회의 안건</h2>
        </div>
        {[
          {
            title: '백엔드 API 명세서',
            content:
              '사용자 인증, 회의 생성/조회, 파일 업로드 API 등 주요 엔드포인트 설계 및 데이터 구조 검토가 필요합니다.',
          },
          {
            title: '프론트엔드 UI/UX 개선',
            content:
              '대시보드 레이아웃 최적화, 모바일 반응형 디자인, 사용자 피드백 반영을 통한 인터페이스 개선 방안을 논의합니다.',
          },
        ].map((agenda, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={agendaChecked[i]}
                onChange={() => handleAgendaCheck(i)}
                className="cursor-pointer accent-black"
              />
              <span className="text-sm text-[#000000]">{agenda.title}</span>
            </div>
            <textarea
              disabled
              value={agenda.content}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-[#666666] bg-[#F9F9F9] resize-none"
              rows={2}
            />
          </div>
        ))}
      </section>

      {/* 하단 버튼 */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          className="px-6 py-2 text-sm font-medium text-[#000000] border border-gray-300"
        >
          수정하기
        </Button>
        <Button className="bg-[#FFD93D] hover:bg-yellow-400 text-white font-semibold px-6 py-2 text-sm">
          회의 시작
        </Button>
      </div>
    </div>
  );
}
