'use client';

import { Button } from '@/components/internal/ui/button';
import { CalendarIcon, Clock, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMeetingDetail, MeetingDetail } from '@/api/meeting';
import MeetingCreateModal from '@/components/meeting/MeetingCreateModal';

export default function MeetingInfoPage() {
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;

  const fetchMeetingDetail = async () => {
    try {
      const data = await getMeetingDetail(Number(meetingId));
      setMeetingDetail(data);
    } catch (err) {
      console.error('회의 정보 조회 실패:', err);
    }
  };

  useEffect(() => {
    fetchMeetingDetail();
  }, [meetingId]);

  // 역할별 색깔 배정 함수
  const getRoleColor = (role: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-red-100 text-red-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600',
    ];

    if (!meetingDetail) return 'bg-gray-200 text-gray-500';

    const uniqueRoles = [...new Set(meetingDetail.participants.map((p) => p.part))];
    const roleIndex = uniqueRoles.indexOf(role);

    return roleIndex !== -1 && roleIndex < colors.length
      ? colors[roleIndex]
      : 'bg-gray-200 text-gray-500';
  };

  if (!meetingDetail) return <div className="p-8">회의 정보를 불러오는 중입니다...</div>;

  return (
    <div className="px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-[#000000]">{meetingDetail.title}</h1>

        <Button
          variant="outline"
          className="px-6 py-2 text-sm font-medium text-[#000000] border border-gray-300"
          onClick={() => setModalOpen(true)}
        >
          수정하기
        </Button>

        {modalOpen && meetingDetail && (
          <MeetingCreateModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            mode="edit"
            teamId={meetingDetail.teamId.toString()}
            onSuccess={() => {
              fetchMeetingDetail(); // 수정 후 회의 정보 다시 불러오기
            }}
            existingMeeting={{
              teamId: meetingDetail.teamId.toString(),
              title: meetingDetail.title,
              date: new Date(meetingDetail.meetingAt),
              time: new Date(meetingDetail.meetingAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }),
              recordType: meetingDetail.meetingMethod as 'RECORD' | 'REALTIME',
              members: meetingDetail.participants.map((p) => ({
                userId: p.userId,
                name: String(p.userId),
                role: p.part,
              })),
              agendaItems: meetingDetail.agendas.map((a) => ({
                type: a.agenda,
                content: a.body,
              })),
            }}
          />
        )}
      </div>

      {/* 회의 정보 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#000000] mb-4">회의 정보</h2>
        <div className="grid grid-cols-3 gap-4 text-sm text-[#000000]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">날짜</span>
            </div>
            <span>{meetingDetail.meetingAt.slice(0, 10)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">시간</span>
            </div>
            <span>
              {new Date(meetingDetail.meetingAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">기록 방식</span>
            </div>
            <span className="font-medium">
              {meetingDetail.meetingMethod === 'RECORD' ? '파일 업로드' : '실시간 녹음'}
            </span>
          </div>
        </div>
      </section>

      {/* 참석자 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#000000] mb-4">
          참석자 ({meetingDetail.participants.length}명)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {meetingDetail.participants.map((member, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-sm text-[#000000] truncate">{member.userId}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getRoleColor(member.part)}`}
              >
                {member.part}
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
        {meetingDetail.agendas.map((agenda, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 border-2 border-[#666666] rounded-full"></div>
              <span className="text-sm text-[#000000]">{agenda.agenda}</span>
            </div>
            <textarea
              disabled
              value={agenda.body}
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
          onClick={() => setModalOpen(true)}
        >
          수정하기
        </Button>
        <Button
          className="bg-[#FFD93D] hover:bg-yellow-400 text-white font-semibold px-6 py-2 text-sm"
          onClick={() => router.push(`/meeting/${meetingId}`)}
        >
          회의 시작
        </Button>
      </div>
    </div>
  );
}
